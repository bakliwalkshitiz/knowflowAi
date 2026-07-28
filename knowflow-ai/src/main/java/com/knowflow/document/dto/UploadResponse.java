package com.knowflow.document.dto;

public record UploadResponse(

        String fileName,

        long size,

        String status

) {
}