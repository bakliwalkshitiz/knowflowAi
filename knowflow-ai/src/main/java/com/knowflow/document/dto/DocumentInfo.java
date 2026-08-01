package com.knowflow.document.dto;

import java.time.LocalDateTime;

public record DocumentInfo(

        String documentId,
        String fileName,
        LocalDateTime uploadedAt

) {
}