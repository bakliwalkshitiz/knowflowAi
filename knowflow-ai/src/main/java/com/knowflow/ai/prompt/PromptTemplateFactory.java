package com.knowflow.ai.prompt;

import com.knowflow.common.enums.PromptType;
import org.springframework.stereotype.Component;

@Component
public class PromptTemplateFactory {

    public String buildPrompt(PromptType type, String message) {

        return switch (type) {

            case EXPLAIN -> """
                    Explain the following topic in simple language.

                    Topic:
                    %s
                    """.formatted(message);

            case SUMMARY -> """
                    Summarize the following text.

                    Text:
                    %s
                    """.formatted(message);

            case NOTES -> """
                    Create interview notes for the following topic.

                    Topic:
                    %s
                    """.formatted(message);

            case QUIZ -> """
                    Generate 10 MCQs from the following topic.

                    Topic:
                    %s
                    """.formatted(message);

            case TRANSLATE -> """
                    Translate the following text into English.

                    Text:
                    %s
                    """.formatted(message);
        };
    }
}