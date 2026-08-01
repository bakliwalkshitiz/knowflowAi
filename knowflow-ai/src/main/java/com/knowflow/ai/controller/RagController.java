package com.knowflow.ai.controller;

import com.knowflow.ai.dto.RagRequest;
import com.knowflow.ai.dto.RagResponse;
import com.knowflow.ai.rag.RagService;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Flux;

@RestController
@RequestMapping("/api/v1/rag")
public class RagController {

    private final RagService ragService;

    public RagController(RagService ragService) {
        this.ragService = ragService;
    }

    @GetMapping
    public RagResponse ask(@RequestParam String question) {
        return ragService.ask(question);
    }

    @PostMapping("/search")
    public RagResponse search(@RequestBody RagRequest request) {
        return ragService.ask(request);
    }

    @GetMapping(
            value = "/stream",
            produces = MediaType.TEXT_EVENT_STREAM_VALUE
    )
    public Flux<String> stream(@RequestParam String question) {
        return ragService.stream(question);
    }
}