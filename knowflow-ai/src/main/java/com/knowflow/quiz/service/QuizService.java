package com.knowflow.quiz.service;

import com.knowflow.ai.rag.RagService;
import com.knowflow.quiz.dto.QuizRequest;
import com.knowflow.quiz.dto.QuizResponse;
import org.springframework.ai.document.Document;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class QuizService {

    private final RagService ragService;

    public QuizService(RagService ragService) {
        this.ragService = ragService;
    }

    public QuizResponse generateQuiz(QuizRequest request) {

        List<Document> documents = ragService.getDocumentsById(
                "Generate quiz",
                List.of(request.documentId().toString())
        );

        return ragService.askWithCustomPrompt(
                """
                You are KnowFlow AI.

                Generate exactly %d multiple choice questions.

                Rules:
                1. Use ONLY the provided context.
                2. Do not use outside knowledge.
                3. Every question must have exactly 4 options.
                4. Exactly one option must be correct.
                5. Keep explanations short.
                """.formatted(request.count()),
                """
                Context:

                %s
                """,
                documents,
                QuizResponse.class
        );
    }
}