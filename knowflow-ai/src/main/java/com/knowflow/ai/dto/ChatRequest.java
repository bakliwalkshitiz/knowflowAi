package com.knowflow.ai.dto;

import com.knowflow.common.enums.PromptType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.util.List;

@Data
public class ChatRequest {

    @NotNull
    private PromptType type;

    @NotBlank
    private String conversationId;

    @NotBlank
    private String message;

    private List<String> documentIds;
}