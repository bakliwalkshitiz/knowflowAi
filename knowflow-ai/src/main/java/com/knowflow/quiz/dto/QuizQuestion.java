package com.knowflow.quiz.dto;

import java.util.List;

public record QuizQuestion(
        String question,
        List<String> options,
        String correctAnswer,
        String explanation
) {
}