package com.knowflow.document.dto;

public record UploadResponse(
        String id,
        String documentId,
        String fileName,
        long size,
        String status
) {
    public UploadResponse(String documentId, String fileName, long size, String status) {
        this(documentId, documentId, fileName, size, status);
    }
}