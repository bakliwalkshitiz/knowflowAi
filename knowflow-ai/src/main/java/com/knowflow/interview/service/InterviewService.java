package com.knowflow.interview.service;

import com.knowflow.ai.rag.RagService;
import com.knowflow.interview.dto.InterviewRequest;
import com.knowflow.interview.dto.InterviewResponse;
import org.springframework.ai.document.Document;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class InterviewService {

    private final RagService ragService;

    public InterviewService(RagService ragService) {
        this.ragService = ragService;
    }

    public InterviewResponse generateInterviewQuestions(
            InterviewRequest request
    ) {

        List<Document> documents = ragService.getDocumentsById(
                "Generate interview questions",
                List.of(request.documentId().toString())
        );

        return ragService.askWithCustomPrompt(
                """
                You are KnowFlow AI.

                Generate exactly %d interview questions.

                Difficulty Level:
                %s

                Rules:
                1. Use ONLY the provided context.
                2. Don't use outside knowledge.
                3. Questions should match the requested difficulty.
                4. Answers should be concise but interview-ready.
                """
                        .formatted(
                                request.count(),
                                request.level()
                        ),

                """
                Context:

                %s
                """,

                documents,

                InterviewResponse.class
        );
    }
}