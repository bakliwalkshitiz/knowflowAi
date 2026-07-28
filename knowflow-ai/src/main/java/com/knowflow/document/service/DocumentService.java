package com.knowflow.document.service;

import com.knowflow.document.dto.UploadResponse;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;

@Service
public class DocumentService {

    private static final String UPLOAD_DIR = "uploads";

    public UploadResponse upload(MultipartFile file) throws IOException {

        Path uploadPath = Paths.get(UPLOAD_DIR);

        if (!Files.exists(uploadPath)) {
            Files.createDirectories(uploadPath);
        }

        Path filePath = uploadPath.resolve(file.getOriginalFilename());

        Files.copy(file.getInputStream(), filePath);

        return new UploadResponse(
                file.getOriginalFilename(),
                file.getSize(),
                "Uploaded Successfully"
        );
    }
}