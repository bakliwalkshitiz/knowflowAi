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

            String context = "";
            if (matchingDocs != null && !matchingDocs.isEmpty()) {
                context = matchingDocs.stream()
                        .map(org.springframework.ai.document.Document::getText)
                        .filter(t -> t != null && !t.isBlank())
                        .collect(Collectors.joining("\n---\n"));
            }

            // Fallback: If vector search returns 0 chunks for attached documents (e.g. short/numerical prompts like "20" or "quiz"), extract document text directly
            if ((context == null || context.isBlank()) && documentIds != null && !documentIds.isEmpty()) {
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

        try {
            String response = chatClient
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

    public Flux<String> stream(String conversationId, String message) {
        return chatClient
                .prompt()
                .system("You are KnowFlow AI.")
                .user(message)
                .advisors(a -> a.param(ChatMemory.CONVERSATION_ID, conversationId))
                .stream()
                .content();
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