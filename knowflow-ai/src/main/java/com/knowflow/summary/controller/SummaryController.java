package com.knowflow.summary.controller;

import com.knowflow.summary.dto.SummaryRequest;
import com.knowflow.summary.dto.SummaryResponse;
import com.knowflow.summary.service.SummaryService;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/summary")
public class SummaryController {

    private final SummaryService summaryService;

    public SummaryController(SummaryService summaryService) {
        this.summaryService = summaryService;
    }

    @PostMapping
    public SummaryResponse summarize(
            @RequestBody SummaryRequest request
    ) {
        return summaryService.generateSummary(request);
    }
}