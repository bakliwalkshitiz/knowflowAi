package com.knowflow.ai.controller;

import com.knowflow.ai.dto.ChatHistoryResponse;
import com.knowflow.ai.dto.ChatRequest;
import com.knowflow.ai.dto.ChatResponse;
import com.knowflow.ai.dto.ExplainResponse;
import com.knowflow.ai.service.ChatService;
import jakarta.validation.Valid;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Flux;

import java.util.List;

@RestController
@RequestMapping("/api/v1/chat")
public class ChatController {

    private final ChatService chatService;

    public ChatController(ChatService chatService) {
        this.chatService = chatService;
    }

    @PostMapping
    public ChatResponse chat(@Valid @RequestBody ChatRequest request) {

        return chatService.chat(
                request.getType(),
                request.getConversationId(),
                request.getMessage(),
                request.getDocumentIds()
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
        return chatService.getAllHistory();
    }

    @GetMapping("/history/{conversationId}")
    public List<ChatHistoryResponse> getChatHistory(@PathVariable String conversationId) {
        return chatService.getChatHistory(conversationId);
    }
}