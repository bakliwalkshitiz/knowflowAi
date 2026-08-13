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
import org.springframework.ai.vectorstore.SearchRequest;
import org.springframework.ai.vectorstore.VectorStore;
import org.springframework.ai.vectorstore.filter.Filter;
import org.springframework.ai.vectorstore.filter.FilterExpressionBuilder;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Flux;

import java.util.List;
import java.util.UUID;
import java.util.concurrent.atomic.AtomicReference;
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
                       DocumentService documentService) {

        this.promptTemplateFactory = promptTemplateFactory;
        this.chatMemory = chatMemory;
        this.chatHistoryRepository = chatHistoryRepository;
        this.securityUtils = securityUtils;
        this.vectorStore = vectorStore;
        this.documentService = documentService;

        Object[] toolBeans = new Object[]{
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

    public ChatResponse chat(PromptType type,
                             String conversationId,
                             String message,
                             List<String> documentIds) {

        User currentUser = securityUtils.getCurrentUser();
        String userIdStr = currentUser.getId().toString();

        log.info("Chat request from user={} type={} conversationId={} messageLength={} documentIds={}",
                currentUser.getEmail(), type, conversationId,
                message != null ? message.length() : 0, documentIds);

        String basePrompt = promptTemplateFactory.buildPrompt(type, message);
        String finalPrompt = basePrompt;

        // Perform strict vector similarity search ONLY when documents are explicitly attached to the prompt
        if (documentIds != null && !documentIds.isEmpty()) {
            try {
                var b = new FilterExpressionBuilder();
                Filter.Expression filterExpression;

                if (documentIds.size() == 1) {
                    filterExpression = b.eq("documentId", documentIds.get(0)).build();
                } else {
                    filterExpression = b.in("documentId", documentIds.toArray()).build();
                }

                SearchRequest searchRequest = SearchRequest.builder()
                        .query((message != null && !message.isBlank()) ? message : "overview summary key points notes")
                        .topK(10)
                        .filterExpression(filterExpression)
                        .build();

                List<org.springframework.ai.document.Document> matchingDocs = vectorStore.similaritySearch(searchRequest);

                // Auto-heal: If empty and specific documentIds are attached, auto-reindex them on-the-fly!
                if (matchingDocs == null || matchingDocs.isEmpty()) {
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

                String context = "";
                if (matchingDocs != null && !matchingDocs.isEmpty()) {
                    context = matchingDocs.stream()
                            .map(org.springframework.ai.document.Document::getText)
                            .filter(t -> t != null && !t.isBlank())
                            .collect(Collectors.joining("\n---\n"));
                }

                // Fallback: If vector search returns 0 chunks for attached documents (e.g. short/numerical prompts like "20" or "quiz"), extract document text directly
                if (context == null || context.isBlank()) {
                    StringBuilder fallbackSb = new StringBuilder();
                    for (String docIdStr : documentIds) {
                        try {
                            String docText = documentService.getDocumentText(UUID.fromString(docIdStr));
                            if (docText != null && !docText.isBlank()) {
                                fallbackSb.append(docText).append("\n---\n");
                            }
                        } catch (Exception ex) {
                            log.warn("Direct document text extraction warning for docId {}: {}", docIdStr, ex.getMessage());
                        }
                    }
                    context = fallbackSb.toString();
                }

                if (context != null && !context.isBlank()) {
                    finalPrompt = basePrompt + "\n\n--- STRICT DOCUMENT CONTEXT FROM ATTACHED FILES ---\n" + context + "\n--- END CONTEXT ---";
                    log.info("Appended document context for documentIds {} in conversation '{}'", documentIds, conversationId);
                }
            } catch (Exception e) {
                log.warn("Vector similarity search warning for query '{}': {}", message, e.getMessage());
            }
        }

        try {
            // Scope the conversation ID to the current user with a deterministic 36-char UUID to fit SPRING_AI_CHAT_MEMORY VARCHAR(36) column
            String rawScope = userIdStr + ":" + (conversationId != null ? conversationId : "default");
            String scopedConversationId = UUID.nameUUIDFromBytes(rawScope.getBytes(java.nio.charset.StandardCharsets.UTF_8)).toString();

            String response = chatClient
                    .prompt()
                    .system("""
                            You are KnowFlow AI, an intelligent AI knowledge vault assistant for students, developers, and engineers.

                            STRICT MARKDOWN FORMATTING RULES — follow these EXACTLY:

                            1. ALWAYS STRUCTURE YOUR RESPONSE IN CLEAN MARKDOWN:
                               - EVERY heading (## or ###) MUST be on its OWN line with a BLANK LINE before it.
                               - NEVER run a heading into a paragraph. Always put a blank line after a heading too.
                               - Use ## for main sections, ### for sub-sections.
                               - Use bullet points (-) for lists, numbered lists (1. 2. 3.) for steps.
                               - Use **bold** for key terms.
                               - Use `inline code` for technical terms, variable names, function names.
                               - Use triple backtick code blocks with language tag for all code:
                                 ```java
                                 // code here
                                 ```
                               - Use > for important notes or quotes.
                               - NEVER output LaTeX delimiters like \\( \\) or \\[ \\]. Write math as plain text (e.g. a/b = 0.5).

                            2. RESPONSE STRUCTURE EXAMPLE:
                               ## Main Topic

                               Brief intro paragraph here.

                               ### Sub-section 1

                               - Point one
                               - Point two

                               ### Sub-section 2

                               More content here.

                            3. SPECIALIZED AI TOOLS:
                               - You have 7 active AI tools: CalculatorTool, DateTimeTool, UUIDTool, CodeFormatterTool, TextAnalyzerTool, UnitConverterTool, WeatherMockTool.
                               - For calculations, date/time, UUID, code metrics, unit conversions, or weather — ALWAYS invoke the matching tool.

                            4. DOCUMENT SCOPE:
                               - If 'STRICT DOCUMENT CONTEXT FROM ATTACHED FILES' is provided, base answers strictly on that content.

                            5. START DIRECTLY:
                               - Begin your response with the content. No meta-tags, no disclaimers, no prefixes.
                            """)
                    .user(finalPrompt)
                    .advisors(a -> a.param(ChatMemory.CONVERSATION_ID, scopedConversationId))
                    .call()
                    .content();

            log.info("Chat response generated successfully for user={} conversationId={} responseLength={}",
                    currentUser.getEmail(), conversationId, response != null ? response.length() : 0);

            // Persist chat exchange for the authenticated user with explicit promptType mode
            chatHistoryRepository.save(
                    ChatHistory.builder()
                            .user(currentUser)
                            .conversationId(conversationId)
                            .prompt(message)
                            .response(response)
                            .promptType(type != null ? type : PromptType.CHAT)
                            .build()
            );

            return new ChatResponse(response);
        } catch (Exception ex) {
            log.error("OpenAI ChatClient call FAILED for user={} conversationId={}: {}",
                    currentUser.getEmail(), conversationId, ex.getMessage(), ex);
            return new ChatResponse("⚠️ AI service error: " + ex.getMessage());
        }
    }

    public Flux<String> stream(String conversationId, String message) {
        return chatClient
                .prompt()
                .system("You are KnowFlow AI.")
                .user(message)
                .advisors(a -> a.param(ChatMemory.CONVERSATION_ID, conversationId))
                .stream()
                .content();
    }

    /**
     * Full-featured streaming chat: builds RAG/document context, applies system prompt and
     * memory advisor (same as chat()), streams tokens, then persists the assembled response.
     */
    public Flux<String> streamChat(PromptType type,
                                   String conversationId,
                                   String message,
                                   List<String> documentIds) {

        User currentUser = securityUtils.getCurrentUser();
        String userIdStr = currentUser.getId().toString();

        log.info("Streaming chat request from user={} type={} conversationId={} documentIds={}",
                currentUser.getEmail(), type, conversationId, documentIds);

        String basePrompt = promptTemplateFactory.buildPrompt(type, message);
        String finalPrompt = basePrompt;

        // Perform vector similarity search when documents are explicitly attached
        if (documentIds != null && !documentIds.isEmpty()) {
            try {
                var b = new FilterExpressionBuilder();
                Filter.Expression filterExpression;

                if (documentIds.size() == 1) {
                    filterExpression = b.eq("documentId", documentIds.get(0)).build();
                } else {
                    filterExpression = b.in("documentId", documentIds.toArray()).build();
                }

                SearchRequest searchRequest = SearchRequest.builder()
                        .query((message != null && !message.isBlank()) ? message : "overview summary key points notes")
                        .topK(10)
                        .filterExpression(filterExpression)
                        .build();

                List<org.springframework.ai.document.Document> matchingDocs = vectorStore.similaritySearch(searchRequest);

                if (matchingDocs == null || matchingDocs.isEmpty()) {
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

                String context = "";
                if (matchingDocs != null && !matchingDocs.isEmpty()) {
                    context = matchingDocs.stream()
                            .map(org.springframework.ai.document.Document::getText)
                            .filter(t -> t != null && !t.isBlank())
                            .collect(Collectors.joining("\n---\n"));
                }

                if (context == null || context.isBlank()) {
                    StringBuilder fallbackSb = new StringBuilder();
                    for (String docIdStr : documentIds) {
                        try {
                            String docText = documentService.getDocumentText(UUID.fromString(docIdStr));
                            if (docText != null && !docText.isBlank()) {
                                fallbackSb.append(docText).append("\n---\n");
                            }
                        } catch (Exception ex) {
                            log.warn("Direct document text extraction warning for docId {}: {}", docIdStr, ex.getMessage());
                        }
                    }
                    context = fallbackSb.toString();
                }

                if (context != null && !context.isBlank()) {
                    finalPrompt = basePrompt + "\n\n--- STRICT DOCUMENT CONTEXT FROM ATTACHED FILES ---\n" + context + "\n--- END CONTEXT ---";
                }
            } catch (Exception e) {
                log.warn("Vector similarity search warning during stream for query '{}': {}", message, e.getMessage());
            }
        }

        String rawScope = userIdStr + ":" + (conversationId != null ? conversationId : "default");
        String scopedConversationId = UUID.nameUUIDFromBytes(rawScope.getBytes(java.nio.charset.StandardCharsets.UTF_8)).toString();
        final String promptFinal = finalPrompt;

        // Accumulate streamed tokens so we can persist the full response on completion
        AtomicReference<String> assembled = new AtomicReference<>("");

        final UUID currentUserId = currentUser.getId();
        final String currentUserEmail = currentUser.getEmail();

        return chatClient
                .prompt()
                .system("""
                        You are KnowFlow AI, an intelligent AI knowledge vault assistant for students, developers, and engineers.

                        STRICT MARKDOWN FORMATTING RULES — follow these EXACTLY:

                        1. ALWAYS STRUCTURE YOUR RESPONSE IN CLEAN MARKDOWN:
                           - EVERY heading (## or ###) MUST be on its OWN line with a BLANK LINE before it.
                           - NEVER run a heading into a paragraph. Always put a blank line after a heading too.
                           - Use ## for main sections, ### for sub-sections.
                           - Use bullet points (-) for lists, numbered lists (1. 2. 3.) for steps.
                           - Use **bold** for key terms.
                           - Use `inline code` for technical terms, variable names, function names.
                           - Use triple backtick code blocks with language tag for all code.
                           - Use > for important notes or quotes.
                           - NEVER output LaTeX delimiters like \\( \\) or \\[ \\]. Write math as plain text (e.g. a/b = 0.5).

                        2. RESPONSE STRUCTURE EXAMPLE:
                           ## Main Topic

                           Brief intro paragraph here.

                           ### Sub-section 1

                           - Point one
                           - Point two

                           ### Sub-section 2

                           More content here.

                        3. SPECIALIZED AI TOOLS:
                           - You have 7 active AI tools: CalculatorTool, DateTimeTool, UUIDTool, CodeFormatterTool, TextAnalyzerTool, UnitConverterTool, WeatherMockTool.
                           - For calculations, date/time, UUID, code metrics, unit conversions, or weather — ALWAYS invoke the matching tool.

                        4. DOCUMENT SCOPE:
                           - If 'STRICT DOCUMENT CONTEXT FROM ATTACHED FILES' is provided, base answers strictly on that content.

                        5. START DIRECTLY:
                           - Begin your response with the content. No meta-tags, no disclaimers, no prefixes.
                        """)

                .user(promptFinal)
                .advisors(a -> a.param(ChatMemory.CONVERSATION_ID, scopedConversationId))
                .stream()
                .content()
                .doOnNext(token -> assembled.updateAndGet(prev -> prev + (token != null ? token : "")))
                .doOnComplete(() -> {
                    try {
                        String fullResponse = assembled.get();
                        User userRef = User.builder().id(currentUserId).build();
                        chatHistoryRepository.save(
                                ChatHistory.builder()
                                        .user(userRef)
                                        .conversationId(conversationId)
                                        .prompt(message)
                                        .response(fullResponse)
                                        .promptType(type != null ? type : PromptType.CHAT)
                                        .build()
                        );
                        log.info("Stream chat persisted for user={} conversationId={} length={}",
                                currentUserEmail, conversationId, fullResponse.length());
                    } catch (Exception ex) {
                        log.error("Failed to persist streamed response for conversationId={}: {}", conversationId, ex.getMessage());
                    }
                })
                .doOnError(err -> log.error("Stream error for user={} conversationId={}: {}",
                        currentUserEmail, conversationId, err.getMessage()));
    }

    public ExplainResponse explain(String conversationId, String topic) {
        return chatClient
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
                        h.getPromptType() != null ? h.getPromptType().name() : "CHAT",
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
                        h.getPromptType() != null ? h.getPromptType().name() : "CHAT",
                        h.getCreatedAt()
                ))
                .toList();
    }
}