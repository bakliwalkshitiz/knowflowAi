package com.knowflow.document.metadata;

import java.time.LocalDateTime;

public record DocumentMetadata(

        String documentId,
        String fileName,
        Integer chunkNumber,
        LocalDateTime uploadedAt

) {}