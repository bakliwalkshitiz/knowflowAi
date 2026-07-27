package com.knowflow.ai.controller;

import com.knowflow.ai.dto.ChatRequest;
import com.knowflow.ai.dto.ChatResponse;
import com.knowflow.ai.service.ChatService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/chat")
public class ChatController {

    private final ChatService chatService;

    public ChatController(ChatService chatService) {
        this.chatService = chatService;
    }

    @PostMapping
    public ChatResponse chat(@Valid @RequestBody ChatRequest request) {

        return chatService.chat(request.getMessage());

    }

}