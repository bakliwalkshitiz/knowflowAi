package com.knowflow.document.service;

import com.knowflow.document.dto.UploadResponse;
import com.knowflow.document.parser.DocumentParser;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import org.apache.tika.exception.TikaException;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;

@Service
public class DocumentService {

    private static final String UPLOAD_DIR = "uploads";
    private final DocumentParser documentParser;

    public DocumentService(DocumentParser documentParser) {
        this.documentParser = documentParser;
    }

    public UploadResponse upload(MultipartFile file)
            throws IOException, TikaException {

        Path uploadPath = Paths.get(UPLOAD_DIR);

        if (!Files.exists(uploadPath)) {
            Files.createDirectories(uploadPath);
        }

        Path filePath = uploadPath.resolve(file.getOriginalFilename());

        Files.copy(
                file.getInputStream(),
                filePath,
                StandardCopyOption.REPLACE_EXISTING
        );

        String extractedText = documentParser.extractText(filePath.toFile());

        System.out.println(extractedText);

        return new UploadResponse(
                file.getOriginalFilename(),
                file.getSize(),
                "Uploaded Successfully"
        );
    }
}