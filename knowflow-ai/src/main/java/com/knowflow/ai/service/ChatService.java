package com.knowflow.ai.service;

import com.knowflow.ai.dto.ChatResponse;
import com.knowflow.ai.prompt.PromptTemplateFactory;
import com.knowflow.common.enums.PromptType;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.stereotype.Service;

@Service
public class ChatService {

    private final ChatClient chatClient;
    private final PromptTemplateFactory promptTemplateFactory;

    public ChatService(ChatClient.Builder builder,
                       PromptTemplateFactory promptTemplateFactory) {

        this.chatClient = builder.build();
        this.promptTemplateFactory = promptTemplateFactory;
    }

    public ChatResponse chat(PromptType type, String message) {

        String prompt =
                promptTemplateFactory.buildPrompt(
                        type,
                        message
                );

        String response = chatClient
                .prompt()
                .system("""
            You are KnowFlow AI.

            You are an AI assistant for students and software engineers.

            Always answer professionally.

            Use Markdown formatting whenever appropriate.

            Keep responses concise but complete.

            If code is requested, provide clean, production-quality examples with explanations.
            """)
                .user(prompt)
                .call()
                .content();

        return new ChatResponse(response);
    }
}