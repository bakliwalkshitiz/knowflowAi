package com.knowflow.quiz.dto;

import java.util.List;

public record QuizResponse(
        List<QuizQuestion> questions
) {
}