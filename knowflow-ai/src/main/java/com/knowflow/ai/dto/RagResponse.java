package com.knowflow.ai.dto;

import java.util.List;

public record RagResponse(

        String answer,
        List<SourceDto> sources

) {
}