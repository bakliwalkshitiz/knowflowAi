package com.knowflow.summary.service;

import com.knowflow.ai.rag.RagService;
import com.knowflow.summary.dto.SummaryRequest;
import com.knowflow.summary.dto.SummaryResponse;
import org.springframework.ai.document.Document;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class SummaryService {

    private final RagService ragService;

    public SummaryService(RagService ragService) {
        this.ragService = ragService;
    }

    public SummaryResponse generateSummary(SummaryRequest request) {

        List<Document> documents = ragService.getDocumentsById(
                "summary",
                List.of(request.documentId().toString())
        );

        String summary = ragService.askWithCustomPrompt(
                """
                You are KnowFlow AI.

                Create a concise summary using ONLY the provided context.

                Rules:
                1. Do not use outside knowledge.
                2. Write at most %d bullet points.
                3. Highlight only the important concepts.
                4. Use markdown.
                """.formatted(request.maxPoints()),
                """
                Context:

                %s
                """,
                documents
        );

        return new SummaryResponse(summary);
    }
}