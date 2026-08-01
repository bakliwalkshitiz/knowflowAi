package com.knowflow.quiz.controller;

import com.knowflow.quiz.dto.QuizRequest;
import com.knowflow.quiz.dto.QuizResponse;
import com.knowflow.quiz.service.QuizService;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/quiz")
public class QuizController {

    private final QuizService quizService;

    public QuizController(
            QuizService quizService
    ) {
        this.quizService = quizService;
    }

    @PostMapping
    public QuizResponse generate(
            @RequestBody QuizRequest request
    ) {
        return quizService.generateQuiz(request);
    }
}