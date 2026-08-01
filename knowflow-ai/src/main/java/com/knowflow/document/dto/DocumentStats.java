package com.knowflow.document.dto;

public record DocumentStats(

        long totalDocuments,
        long totalChunks,
        long totalFileSize

) {}