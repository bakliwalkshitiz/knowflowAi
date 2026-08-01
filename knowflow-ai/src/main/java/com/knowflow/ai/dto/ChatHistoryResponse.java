package com.knowflow.ai.dto;

import java.time.LocalDateTime;

public record ChatHistoryResponse(
        String conversationId,
        String prompt,
        String response,
        LocalDateTime createdAt
) {
}
