package com.knowflow.ai.dto;

import com.knowflow.common.enums.PromptType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class ChatRequest {

    @NotNull
    private PromptType type;

    @NotBlank
    private String message;

}