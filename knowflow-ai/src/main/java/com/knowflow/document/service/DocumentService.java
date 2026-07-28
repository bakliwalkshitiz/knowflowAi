package com.knowflow.document.service;

import com.knowflow.document.chunk.DocumentChunker;
import com.knowflow.document.dto.UploadResponse;
import com.knowflow.document.parser.DocumentParser;
import org.apache.tika.exception.TikaException;
import org.springframework.ai.document.Document;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import org.springframework.ai.vectorstore.VectorStore;
import com.knowflow.ai.embedding.EmbeddingService;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.List;

@Service
public class DocumentService {

    private static final String UPLOAD_DIR = "uploads";

    private final DocumentParser documentParser;
    private final DocumentChunker documentChunker;
    private final EmbeddingService embeddingService;
    private final VectorStore vectorStore;

    public DocumentService(DocumentParser documentParser,
                           DocumentChunker documentChunker,
                           EmbeddingService embeddingService,
                           VectorStore vectorStore) {

        this.documentParser = documentParser;
        this.documentChunker = documentChunker;
        this.embeddingService = embeddingService;
        this.vectorStore = vectorStore;
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

        // Extract text from document
        String extractedText = documentParser.extractText(filePath.toFile());

        // Split into chunks
        List<Document> chunks = documentChunker.chunk(extractedText);

        embeddingService.generateEmbeddings(chunks);

        vectorStore.add(chunks);

        System.out.println("Embeddings stored successfully in PGVector.");

        System.out.println("Total Chunks : " + chunks.size());

        for (int i = 0; i < chunks.size(); i++) {
            System.out.println("========== Chunk " + (i + 1) + " ==========");
            System.out.println(chunks.get(i).getText());
            System.out.println();
        }

        return new UploadResponse(
                file.getOriginalFilename(),
                file.getSize(),
                "Uploaded Successfully"
        );
    }
}