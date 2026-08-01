package com.knowflow.summary.dto;

import java.util.UUID;

public record SummaryRequest(

        UUID documentId,
        int maxPoints

) {
}