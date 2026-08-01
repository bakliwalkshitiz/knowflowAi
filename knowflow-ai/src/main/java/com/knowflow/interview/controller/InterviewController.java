package com.knowflow.interview.controller;

import com.knowflow.interview.dto.InterviewRequest;
import com.knowflow.interview.dto.InterviewResponse;
import com.knowflow.interview.service.InterviewService;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/interview")
public class InterviewController {

    private final InterviewService interviewService;

    public InterviewController(
            InterviewService interviewService
    ) {
        this.interviewService = interviewService;
    }

    @PostMapping
    public InterviewResponse generate(
            @RequestBody InterviewRequest request
    ) {

        return interviewService.generateInterviewQuestions(request);

    }
}