package com.knowflow.ai.service;

import com.knowflow.ai.chat.entity.ChatHistory;
import com.knowflow.ai.chat.repository.ChatHistoryRepository;
import com.knowflow.ai.dto.ChatHistoryResponse;
import com.knowflow.ai.dto.ChatResponse;
import com.knowflow.ai.dto.ExplainResponse;
import com.knowflow.ai.prompt.PromptTemplateFactory;
import com.knowflow.ai.tools.*;
import com.knowflow.common.enums.PromptType;
import com.knowflow.common.util.SecurityUtils;
import com.knowflow.document.service.DocumentService;
import com.knowflow.user.entity.User;
import lombok.extern.slf4j.Slf4j;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.chat.client.advisor.MessageChatMemoryAdvisor;
import org.springframework.ai.chat.memory.ChatMemory;
import org.springframework.ai.openai.OpenAiChatModel;
import org.springframework.ai.vectorstore.SearchRequest;
import org.springframework.ai.vectorstore.VectorStore;
import org.springframework.ai.vectorstore.filter.Filter;
import org.springframework.ai.vectorstore.filter.FilterExpressionBuilder;
import io.micrometer.observation.ObservationRegistry;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Flux;

import java.util.List;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

import java.util.stream.Collectors;

@Slf4j
@Service
public class ChatService {

    private final ChatClient chatClient;
    private final PromptTemplateFactory promptTemplateFactory;
    private final ChatMemory chatMemory;
    private final ChatHistoryRepository chatHistoryRepository;
    private final SecurityUtils securityUtils;
    private final VectorStore vectorStore;
    private final DocumentService documentService;

    private final ObservationRegistry observationRegistry;

    // BYOK: Cache ChatClient instances per API key to avoid recreating on every request
    private final ConcurrentHashMap<String, ChatClient> byokClientCache = new ConcurrentHashMap<>();

    // Store tool beans for dynamic ChatClient creation
    private final Object[] toolBeans;

    public ChatService(ChatClient.Builder builder,
                       PromptTemplateFactory promptTemplateFactory,
                       ChatMemory chatMemory,
                       CalculatorTool calculatorTool,
                       DateTimeTool dateTimeTool,
                       UUIDTool uuidTool,
                       CodeFormatterTool codeFormatterTool,
                       TextAnalyzerTool textAnalyzerTool,
                       UnitConverterTool unitConverterTool,
                       WeatherMockTool weatherMockTool,
                       ChatHistoryRepository chatHistoryRepository,
                       SecurityUtils securityUtils,
                       VectorStore vectorStore,
                       DocumentService documentService,
                       ObservationRegistry observationRegistry) {

        this.promptTemplateFactory = promptTemplateFactory;
        this.chatMemory = chatMemory;
        this.chatHistoryRepository = chatHistoryRepository;
        this.securityUtils = securityUtils;
        this.vectorStore = vectorStore;
        this.documentService = documentService;
        this.observationRegistry = observationRegistry;

        this.toolBeans = new Object[]{
                calculatorTool, dateTimeTool, uuidTool,
                codeFormatterTool, textAnalyzerTool, unitConverterTool, weatherMockTool
        };

        this.chatClient = builder
                .defaultAdvisors(
                        MessageChatMemoryAdvisor.builder(chatMemory).build()
                )
                .defaultTools(toolBeans)
                .build();
    }

    /**
     * BYOK: Build a ChatClient dynamically using the user's own OpenAI API key.
     * Uses ONLY official OpenAI Java SDK classes (com.openai.core.ClientOptions & com.openai.client.OpenAIClientImpl).
     */
    private ChatClient getOrCreateByokClient(String apiKey) {
        return byokClientCache.computeIfAbsent(apiKey, key -> {
            log.info("Creating dynamic BYOK ChatClient for user key hash={}", key.hashCode());
            try {
                org.springframework.ai.openai.http.okhttp.SpringAiOpenAiHttpClient httpTransport =
                        org.springframework.ai.openai.http.okhttp.SpringAiOpenAiHttpClient.builder().build();

                com.openai.core.ClientOptions clientOptions = com.openai.core.ClientOptions.builder()
                        .httpClient(httpTransport)
                        .apiKey(key)
                        .baseUrl("https://api.openai.com/v1")
                        .maxRetries(2)
                        .build();

                com.openai.client.OpenAIClient openAiClient = new com.openai.client.OpenAIClientImpl(clientOptions);

                ObservationRegistry observationRegistry = ObservationRegistry.NOOP;

                OpenAiChatModel dynamicModel = OpenAiChatModel.builder()
                        .openAiClient(openAiClient)
                        .observationRegistry(observationRegistry)
                        .build();

                return ChatClient.builder(dynamicModel)
                        .defaultAdvisors(MessageChatMemoryAdvisor.builder(chatMemory).build())
                        .defaultTools(toolBeans)
                        .build();
            } catch (Exception ex) {
                log.error("Failed to construct dynamic BYOK ChatClient: {}", ex.getMessage(), ex);
                throw new IllegalArgumentException("Failed to construct BYOK ChatClient: " + ex.getMessage(), ex);
            }
        });
    }

    /**
     * Resolve which ChatClient to use: user's BYOK key or default.
     */
    private ChatClient resolveClient(String customApiKey, User user) {
        String keyToUse = null;

        // Priority 1: Header key sent from browser
        if (customApiKey != null && !customApiKey.isBlank() && !customApiKey.contains("sk-dummy")) {
            keyToUse = customApiKey.trim();
            log.info("Using OpenAI API key from request header for user {}", user.getEmail());
        }
        // Priority 2: User's saved key in database
        else if (user.getApiKey() != null && !user.getApiKey().isBlank() && !user.getApiKey().contains("sk-dummy")) {
            keyToUse = user.getApiKey().trim();
            log.info("Using OpenAI API key from database profile for user {}", user.getEmail());
        }

        if (keyToUse != null && !keyToUse.isBlank()) {
            return getOrCreateByokClient(keyToUse);
        }

        log.warn("No valid OpenAI API key found for user {}. Header key={}, DB key={}",
                user.getEmail(),
                customApiKey != null ? "PRESENT" : "MISSING",
                user.getApiKey() != null && !user.getApiKey().isBlank() ? "PRESENT" : "MISSING");

        throw new IllegalArgumentException("No OpenAI API key connected. Please go to Settings and save your OpenAI API key (sk-...).");
    }

    public ChatResponse chat(PromptType type,
                             String conversationId,
                             String message,
                             List<String> documentIds,
                             String customApiKey) {

        User currentUser = securityUtils.getCurrentUser();
        String userIdStr = currentUser.getId().toString();

        log.info("Chat request from user={} type={} conversationId={} messageLength={} documentIds={}",
                currentUser.getEmail(), type, conversationId,
                message != null ? message.length() : 0, documentIds);

        String basePrompt = promptTemplateFactory.buildPrompt(type, message);
        String finalPrompt = basePrompt;

        // Perform strict vector similarity search on uploaded documents
        try {
            var b = new FilterExpressionBuilder();
            Filter.Expression filterExpression = null;

            if (documentIds != null && !documentIds.isEmpty()) {
                if (documentIds.size() == 1) {
                    filterExpression = b.eq("documentId", documentIds.get(0)).build();
                } else {
                    filterExpression = b.in("documentId", documentIds.toArray()).build();
                }
            } else {
                filterExpression = b.eq("userId", userIdStr).build();
            }

            SearchRequest searchRequest = SearchRequest.builder()
                    .query((message != null && !message.isBlank()) ? message : "overview summary key points notes")
                    .topK(10)
                    .filterExpression(filterExpression)
                    .build();

            List<org.springframework.ai.document.Document> matchingDocs = vectorStore.similaritySearch(searchRequest);

            // Auto-heal: If empty and specific documentIds are attached, auto-reindex them on-the-fly!
            if ((matchingDocs == null || matchingDocs.isEmpty()) && documentIds != null && !documentIds.isEmpty()) {
                log.info("PGVector returned 0 chunks for documentIds {}. Triggering auto-reindex...", documentIds);
                for (String docIdStr : documentIds) {
                    try {
                        documentService.reindexDocument(UUID.fromString(docIdStr));
                    } catch (Exception ex) {
                        log.warn("Auto-reindex error for {}: {}", docIdStr, ex.getMessage());
                    }
                }
                matchingDocs = vectorStore.similaritySearch(searchRequest);
            }

            if (matchingDocs != null && !matchingDocs.isEmpty()) {
                String context = matchingDocs.stream()
                        .map(org.springframework.ai.document.Document::getText)
                        .filter(t -> t != null && !t.isBlank())
                        .collect(Collectors.joining("\n---\n"));

                if (!context.isBlank()) {
                    finalPrompt = basePrompt + "\n\n--- STRICT DOCUMENT CONTEXT FROM ATTACHED FILES ---\n" + context + "\n--- END CONTEXT ---";
                    log.info("Appended {} vector context chunks for documentIds {} in conversation '{}'", matchingDocs.size(), documentIds, conversationId);
                }
            }
        } catch (Exception e) {
            log.warn("Vector similarity search warning for query '{}': {}", message, e.getMessage());
        }

        try {
            ChatClient targetClient = resolveClient(customApiKey, currentUser);
            String response = targetClient
                    .prompt()
                    .system("""
                            You are KnowFlow AI, an intelligent AI knowledge vault assistant for students, developers, and engineers.

                            RESPONSE FORMATTING RULES:
                            1. RESPOND IN WELL-STRUCTURED MARKDOWN:
                               - Use bold headers (##, ###) for key sections.
                               - Use clean bullet points or numbered lists.
                               - Do NOT output LaTeX math delimiters like \\( \\) or \\[ \\]. Write math equations using clean standard characters (e.g. 22 / 33 = 0.6667 or 2/3).
                               - Use code blocks ``` for any code or structured data.

                            2. SPECIALIZED AI TOOLS INTEGRATION:
                               - You have 7 active AI tools registered: CalculatorTool, DateTimeTool, UUIDTool, CodeFormatterTool, TextAnalyzerTool, UnitConverterTool, WeatherMockTool.
                               - Whenever a user asks for calculations, date/time, UUID generation, code metrics, text analysis, unit conversions, or weather, ALWAYS invoke the matching tool function.
                               - If asked whether tools are enabled, confirm clearly: "Yes! 7 specialized AI tools are enabled."

                            3. DOCUMENT SCOPE:
                               - If 'STRICT DOCUMENT CONTEXT FROM ATTACHED FILES' is provided, base document answers strictly on that content.
                            """)
                    .user(finalPrompt)
                    .advisors(a -> a.param(ChatMemory.CONVERSATION_ID, conversationId))
                    .call()
                    .content();

            log.info("Chat response generated successfully for user={} conversationId={} responseLength={}",
                    currentUser.getEmail(), conversationId, response != null ? response.length() : 0);

            // Persist chat exchange for the authenticated user
            chatHistoryRepository.save(
                    ChatHistory.builder()
                            .user(currentUser)
                            .conversationId(conversationId)
                            .prompt(message)
                            .response(response)
                            .build()
            );

            return new ChatResponse(response);
        } catch (Exception ex) {
            log.error("OpenAI ChatClient call FAILED for user={} conversationId={}: {}",
                    currentUser.getEmail(), conversationId, ex.getMessage(), ex);
            return new ChatResponse("⚠️ AI service error: " + ex.getMessage());
        }
    }

    public Flux<String> stream(String conversationId, String message, String customApiKey) {
        User currentUser = securityUtils.getCurrentUser();
        ChatClient targetClient = resolveClient(customApiKey, currentUser);
        return targetClient
                .prompt()
                .system("You are KnowFlow AI.")
                .user(message)
                .advisors(a -> a.param(ChatMemory.CONVERSATION_ID, conversationId))
                .stream()
                .content();
    }

    public ExplainResponse explain(String conversationId, String topic, String customApiKey) {
        User currentUser = securityUtils.getCurrentUser();
        ChatClient targetClient = resolveClient(customApiKey, currentUser);
        return targetClient
                .prompt()
                .system("""
                        You are an expert Java teacher. Explain the given topic.
                        Return ONLY valid JSON in the following format:
                        {
                          "title": "...",
                          "summary": "...",
                          "difficulty": "Beginner | Intermediate | Advanced"
                        }
                        """)
                .user(topic)
                .advisors(a -> a.param(ChatMemory.CONVERSATION_ID, conversationId))
                .call()
                .entity(ExplainResponse.class);
    }

    public List<ChatHistoryResponse> getChatHistory(String conversationId) {
        User currentUser = securityUtils.getCurrentUser();
        List<ChatHistory> records = chatHistoryRepository
                .findByUserAndConversationIdOrderByCreatedAtAsc(currentUser, conversationId);

        if (records == null || records.isEmpty()) {
            return List.of();
        }

        return records.stream()
                .map(h -> new ChatHistoryResponse(
                        h.getConversationId(),
                        h.getPrompt(),
                        h.getResponse(),
                        h.getCreatedAt()
                ))
                .toList();
    }

    public List<ChatHistoryResponse> getAllHistory() {
        User currentUser = securityUtils.getCurrentUser();
        List<ChatHistory> records = chatHistoryRepository.findByUserOrderByCreatedAtDesc(currentUser);

        if (records == null || records.isEmpty()) {
            return List.of();
        }

        return records.stream()
                .map(h -> new ChatHistoryResponse(
                        h.getConversationId(),
                        h.getPrompt(),
                        h.getResponse(),
                        h.getCreatedAt()
                ))
                .toList();
    }
}