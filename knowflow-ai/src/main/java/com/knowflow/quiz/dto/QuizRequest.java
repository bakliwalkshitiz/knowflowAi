package com.knowflow.quiz.dto;

import java.util.UUID;

public record QuizRequest(
        UUID documentId,
        int count
) {
}