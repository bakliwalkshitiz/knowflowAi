package com.knowflow.flashcard.service;

import com.knowflow.ai.rag.RagService;
import com.knowflow.flashcard.dto.FlashcardRequest;
import com.knowflow.flashcard.dto.FlashcardResponse;
import org.springframework.ai.document.Document;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class FlashcardService {

    private final RagService ragService;

    public FlashcardService(RagService ragService) {
        this.ragService = ragService;
    }

    public FlashcardResponse generateFlashcards(
            FlashcardRequest request
    ) {

        List<Document> documents = ragService.getDocumentsById(
                "Generate flashcards",
                List.of(request.documentId().toString())
        );

        return ragService.askWithCustomPrompt(
                """
                You are KnowFlow AI.

                Create exactly %d flashcards.

                Rules:
                1. Use ONLY the provided context.
                2. Don't use outside knowledge.
                3. Questions should test important concepts.
                4. Answers should be short and clear.
                """.formatted(request.count()),
                """
                Context:

                %s
                """,
                documents,
                FlashcardResponse.class
        );
    }
}