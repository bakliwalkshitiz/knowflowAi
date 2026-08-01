package com.knowflow.ai.rag;

import com.knowflow.ai.dto.RagRequest;
import com.knowflow.ai.dto.RagResponse;
import com.knowflow.ai.dto.SourceDto;
import com.knowflow.document.retrieval.RetrievalService;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.document.Document;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Flux;

import java.util.List;

@Service
public class RagService {

    private static final String RAG_SYSTEM_PROMPT = """
            You are KnowFlow AI.

            Answer ONLY from the supplied context.

            Rules:
            1. Never use outside knowledge.
            2. Combine information from multiple chunks if needed.
            3. If the answer isn't available in the uploaded documents,
               clearly say so.

            Always answer in markdown.
            """;

    private final RetrievalService retrievalService;
    private final ChatClient chatClient;

    public RagService(RetrievalService retrievalService,
                      ChatClient.Builder builder) {

        this.retrievalService = retrievalService;
        this.chatClient = builder.build();
    }

    // GET /api/rag
    public RagResponse ask(String question) {

        List<Document> documents = retrievalService.retrieve(question);

        return generateResponse(question, documents);
    }

    // POST /api/rag/search
    public RagResponse ask(RagRequest request) {

        List<Document> documents;

        if (request.documentIds() == null || request.documentIds().isEmpty()) {
            documents = retrievalService.retrieve(request.question());
        } else {
            documents = retrievalService.retrieve(
                    request.question(),
                    request.documentIds()
            );
        }

        return generateResponse(request.question(), documents);
    }

    // GET /api/rag/stream
    public Flux<String> stream(String question) {

        List<Document> documents = retrievalService.retrieve(question);

        String context = buildContext(documents);

        return chatClient.prompt()
                .system(RAG_SYSTEM_PROMPT)
                .user("""
                        Context:

                        %s

                        Question:

                        %s
                        """.formatted(context, question))
                .stream()
                .content();
    }

    // Shared Logic
    private RagResponse generateResponse(String question,
                                         List<Document> documents) {

        List<SourceDto> sources = documents.stream()
                .map(document -> new SourceDto(
                        (String) document.getMetadata().get("fileName"),
                        (Integer) document.getMetadata().get("chunkNumber")
                ))
                .toList();

        String answer = chatClient.prompt()
                .system(RAG_SYSTEM_PROMPT)
                .user("""
                        Context:

                        %s

                        Question:

                        %s
                        """.formatted(buildContext(documents), question))
                .call()
                .content();

        return new RagResponse(answer, sources);
    }

    // Used by Summary
    public String askWithCustomPrompt(
            String systemPrompt,
            String userPrompt,
            List<Document> documents
    ) {

        if (documents.isEmpty()) {
            return "No relevant document found.";
        }

        return chatClient.prompt()
                .system(systemPrompt)
                .user(userPrompt.formatted(buildContext(documents)))
                .call()
                .content();
    }

    // Used later by Flashcards, Quiz, MindMap (Structured Output)
    public <T> T askWithCustomPrompt(
            String systemPrompt,
            String userPrompt,
            List<Document> documents,
            Class<T> responseType
    ) {

        if (documents.isEmpty()) {
            throw new IllegalArgumentException("No relevant document found.");
        }

        return chatClient.prompt()
                .system(systemPrompt)
                .user(userPrompt.formatted(buildContext(documents)))
                .call()
                .entity(responseType);
    }

    public List<Document> getDocumentsById(
            String question,
            List<String> documentIds
    ) {

        return retrievalService.retrieve(
                question,
                documentIds
        );
    }

    // Common Context Builder
    private String buildContext(List<Document> documents) {

        StringBuilder context = new StringBuilder();

        for (Document document : documents) {

            context.append("""
                    File: %s
                    Chunk: %s

                    %s

                    ----------------------------

                    """.formatted(
                    document.getMetadata().get("fileName"),
                    document.getMetadata().get("chunkNumber"),
                    document.getText()
            ));
        }

        return context.toString();
    }
}