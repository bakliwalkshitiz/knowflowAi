package com.knowflow.ai.controller;

import com.knowflow.ai.dto.ChatHistoryResponse;
import com.knowflow.ai.dto.ChatRequest;
import com.knowflow.ai.dto.ChatResponse;
import com.knowflow.ai.dto.ExplainResponse;
import com.knowflow.ai.service.ChatService;
import jakarta.validation.Valid;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Flux;

import java.util.ArrayList;
import java.util.List;

@Slf4j
@RestController
@RequestMapping({"/api/v1/chat", "/chat"})
public class ChatController {

    private final ChatService chatService;

    public ChatController(ChatService chatService) {
        this.chatService = chatService;
    }

    @PostMapping
    public ChatResponse chat(
            @Valid @RequestBody ChatRequest request,
            @RequestHeader(value = "X-OpenAI-Api-Key", required = false) String customApiKey
    ) {
        return chatService.chat(
                request.getType(),
                request.getConversationId(),
                request.getMessage(),
                request.getDocumentIds(),
                customApiKey
        );
    }

    @GetMapping(value = "/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public Flux<String> stream(
            @RequestParam String conversationId,
            @RequestParam String message) {
        return chatService.stream(conversationId, message);
    }

    @PostMapping("/explain")
    public ExplainResponse explain(
            @RequestParam String conversationId,
            @RequestParam String topic
    ) {
        return chatService.explain(conversationId, topic);
    }

    @GetMapping("/history")
    public List<ChatHistoryResponse> getAllHistory() {
        log.info("Fetching all chat history for authenticated user...");
        List<ChatHistoryResponse> history = chatService.getAllHistory();
        return history != null ? history : new ArrayList<>();
    }

    @GetMapping("/history/{conversationId}")
    public List<ChatHistoryResponse> getChatHistory(@PathVariable String conversationId) {
        log.info("Fetching chat history for conversation: {}", conversationId);
        List<ChatHistoryResponse> history = chatService.getChatHistory(conversationId);
        return history != null ? history : new ArrayList<>();
    }
}