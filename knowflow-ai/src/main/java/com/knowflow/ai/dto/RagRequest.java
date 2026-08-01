package com.knowflow.ai.dto;

import java.util.List;

public record RagRequest(

        String question,
        List<String> documentIds

) {
}