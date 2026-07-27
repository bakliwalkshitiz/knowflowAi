package com.knowflow.ai.service;

import com.knowflow.ai.dto.ChatResponse;
import com.knowflow.ai.dto.ExplainResponse;
import com.knowflow.ai.prompt.PromptTemplateFactory;
import com.knowflow.common.enums.PromptType;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.stereotype.Service;
import org.springframework.ai.chat.memory.ChatMemory;
import org.springframework.ai.chat.client.advisor.MessageChatMemoryAdvisor;
import reactor.core.publisher.Flux;

@Service
public class ChatService {

    private final ChatClient chatClient;
    private final PromptTemplateFactory promptTemplateFactory;
    private final ChatMemory chatMemory;


    public ChatService(ChatClient.Builder builder,
                       PromptTemplateFactory promptTemplateFactory,
                       ChatMemory chatMemory) {

        this.chatMemory = chatMemory;
        this.promptTemplateFactory = promptTemplateFactory;

        this.chatClient = builder
                .defaultAdvisors(
                        MessageChatMemoryAdvisor.builder(chatMemory).build()
                )
                .build();
    }

    public ChatResponse chat(PromptType type,
                             String conversationId,
                             String message) {

        String prompt = promptTemplateFactory.buildPrompt(type, message);

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
                .advisors(a -> a.param(ChatMemory.CONVERSATION_ID, conversationId))
                .call()
                .content();

        return new ChatResponse(response);
    }

    public Flux<String> stream(String conversationId, String message) {

        return chatClient
                .prompt()
                .system("""
                You are KnowFlow AI.
                """)
                .user(message)
                .advisors(a -> a.param(ChatMemory.CONVERSATION_ID, conversationId))
                .stream()
                .content();
    }

    public ExplainResponse explain(String conversationId, String topic) {

        return chatClient
                .prompt()
                .system("""
                    You are an expert Java teacher.

                    Explain the given topic.

                    Return ONLY valid JSON in the following format:

                    {
                      "title": "...",
                      "summary": "...",
                      "difficulty": "Beginner | Intermediate | Advanced"
                    }
                    """)
                .user(topic)
                .advisors(a ->
                        a.param(ChatMemory.CONVERSATION_ID, conversationId)
                )
                .call()
                .entity(ExplainResponse.class);
    }
}