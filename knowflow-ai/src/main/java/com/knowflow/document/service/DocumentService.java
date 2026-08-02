package com.knowflow.document.service;

import com.knowflow.common.exception.ResourceNotFoundException;
import com.knowflow.common.util.SecurityUtils;
import com.knowflow.document.chunk.DocumentChunker;
import com.knowflow.document.dto.DocumentStats;
import com.knowflow.document.dto.UploadResponse;
import com.knowflow.document.entity.Document;
import com.knowflow.document.parser.DocumentParser;
import com.knowflow.document.repository.DocumentRepository;
import com.knowflow.user.entity.User;
import lombok.extern.slf4j.Slf4j;
import org.apache.tika.exception.TikaException;
import org.springframework.ai.vectorstore.VectorStore;
import org.springframework.ai.vectorstore.filter.FilterExpressionBuilder;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.net.MalformedURLException;
import java.nio.file.*;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Objects;
import java.util.UUID;

@Slf4j
@Service
public class DocumentService {

    private static final String UPLOAD_DIR = "uploads";

    private final DocumentParser documentParser;
    private final DocumentChunker documentChunker;
    private final VectorStore vectorStore;
    private final DocumentRepository documentRepository;
    private final SecurityUtils securityUtils;

    public DocumentService(
            DocumentParser documentParser,
            DocumentChunker documentChunker,
            VectorStore vectorStore,
            DocumentRepository documentRepository,
            SecurityUtils securityUtils) {

        this.documentParser = documentParser;
        this.documentChunker = documentChunker;
        this.vectorStore = vectorStore;
        this.documentRepository = documentRepository;
        this.securityUtils = securityUtils;
    }

    private void deleteEmbeddings(String documentId) {
        try {
            var b = new FilterExpressionBuilder();
            vectorStore.delete(b.eq("documentId", documentId).build().toString());
        } catch (Exception e) {
            log.warn("Vector store deletion warning for doc {}: {}", documentId, e.getMessage());
        }
    }

    public UploadResponse upload(MultipartFile file)
            throws IOException, TikaException {

        User currentUser = securityUtils.getCurrentUser();

        Path uploadPath = Paths.get(UPLOAD_DIR);

        if (!Files.exists(uploadPath)) {
            Files.createDirectories(uploadPath);
        }

        String originalFilename = StringUtils.cleanPath(
                Objects.requireNonNull(file.getOriginalFilename(), "Filename must not be null")
        );

        Path absoluteUploadPath = uploadPath.toAbsolutePath().normalize();
        Path filePath = absoluteUploadPath.resolve(originalFilename).normalize();

        if (!filePath.startsWith(absoluteUploadPath)) {
            throw new IllegalArgumentException("Invalid file path detected: " + originalFilename);
        }

        Files.copy(
                file.getInputStream(),
                filePath,
                StandardCopyOption.REPLACE_EXISTING
        );

        // Extract text
        String extractedText = documentParser.extractText(filePath.toFile());

        // Chunk document
        List<org.springframework.ai.document.Document> chunks =
                documentChunker.chunk(extractedText);

        LocalDateTime uploadedAt = LocalDateTime.now();

        // Save metadata in PostgreSQL
        Document document = Document.builder()
                .fileName(originalFilename)
                .contentType(file.getContentType())
                .fileSize(file.getSize())
                .filePath(filePath.toString())
                .chunkCount(chunks.size())
                .uploadedAt(uploadedAt)
                .user(currentUser)
                .build();

        document = documentRepository.save(document);

        String documentId = document.getId().toString();
        String userIdStr = currentUser.getId().toString();

        // Add metadata to every chunk
        for (int i = 0; i < chunks.size(); i++) {

            org.springframework.ai.document.Document chunk = chunks.get(i);

            chunk.getMetadata().put("documentId", documentId);
            chunk.getMetadata().put("userId", userIdStr);
            chunk.getMetadata().put("fileName", originalFilename);
            chunk.getMetadata().put("chunkNumber", i + 1);
            chunk.getMetadata().put("uploadedAt", uploadedAt.toString());
        }

        // Store embeddings safely (pure BYOK friendly)
        try {
            vectorStore.add(chunks);
            log.info("Stored {} chunks in PGVector for user '{}', document '{}' (id={})",
                    chunks.size(), currentUser.getEmail(), originalFilename, documentId);
        } catch (Exception ex) {
            log.warn("Vector store indexing skipped for document '{}' (id={}): {}",
                    originalFilename, documentId, ex.getMessage());
        }

        return new UploadResponse(
                document.getId().toString(),
                originalFilename,
                file.getSize(),
                "Uploaded Successfully"
        );
    }

    public void reindexDocument(UUID documentId) {
        Document document = documentRepository.findById(documentId).orElse(null);
        if (document == null) return;

        Path filePath = Paths.get(document.getFilePath());
        if (!Files.exists(filePath)) {
            log.warn("Cannot reindex document {}: File does not exist at {}", documentId, filePath);
            return;
        }

        try {
            // Delete old embeddings if any
            deleteEmbeddings(documentId.toString());

            // Extract & sanitize text
            String extractedText = documentParser.extractText(filePath.toFile());

            // Chunk document
            List<org.springframework.ai.document.Document> chunks = documentChunker.chunk(extractedText);

            String userIdStr = document.getUser() != null ? document.getUser().getId().toString() : "";

            for (int i = 0; i < chunks.size(); i++) {
                org.springframework.ai.document.Document chunk = chunks.get(i);
                chunk.getMetadata().put("documentId", documentId.toString());
                chunk.getMetadata().put("userId", userIdStr);
                chunk.getMetadata().put("fileName", document.getFileName());
                chunk.getMetadata().put("chunkNumber", i + 1);
            }

            vectorStore.add(chunks);
            document.setChunkCount(chunks.size());
            documentRepository.save(document);

            log.info("Successfully re-indexed document '{}' (id={}) with {} chunks in PGVector",
                    document.getFileName(), documentId, chunks.size());
        } catch (Exception e) {
            log.error("Failed to reindex document {}: {}", documentId, e.getMessage());
        }
    }

    public String getDocumentText(UUID documentId) {
        try {
            Document document = documentRepository.findById(documentId).orElse(null);
            if (document == null) return null;
            Path filePath = Paths.get(document.getFilePath());
            if (!Files.exists(filePath)) {
                log.warn("Cannot read document text: File does not exist at {}", filePath);
                return null;
            }
            String text = documentParser.extractText(filePath.toFile());
            if (text != null && text.length() > 15000) {
                return text.substring(0, 15000) + "\n...[truncated for length]";
            }
            return text;
        } catch (Exception e) {
            log.warn("Failed to extract document text for id {}: {}", documentId, e.getMessage());
            return null;
        }
    }

    public List<Document> getAllDocuments() {
        User currentUser = securityUtils.getCurrentUser();
        return documentRepository.findByUser(currentUser);
    }

    public Document getDocument(UUID id) {
        User currentUser = securityUtils.getCurrentUser();
        return documentRepository.findByIdAndUser(id, currentUser)
                .orElseThrow(() -> new ResourceNotFoundException("Document not found with id: " + id));
    }

    public void deleteDocument(UUID id) throws IOException {

        User currentUser = securityUtils.getCurrentUser();
        Document document = documentRepository.findByIdAndUser(id, currentUser)
                .orElseThrow(() -> new ResourceNotFoundException("Document not found with id: " + id));

        // Delete uploaded file
        Files.deleteIfExists(Paths.get(document.getFilePath()));

        deleteEmbeddings(document.getId().toString());
        documentRepository.delete(document);
    }

    public Resource downloadDocument(UUID id) throws MalformedURLException {

        User currentUser = securityUtils.getCurrentUser();
        Document document = documentRepository.findByIdAndUser(id, currentUser)
                .orElseThrow(() -> new ResourceNotFoundException("Document not found with id: " + id));

        Path path = Paths.get(document.getFilePath());

        return new UrlResource(path.toUri());
    }

    public Document renameDocument(UUID id, String newName) {

        User currentUser = securityUtils.getCurrentUser();
        Document document = documentRepository.findByIdAndUser(id, currentUser)
                .orElseThrow(() -> new ResourceNotFoundException("Document not found with id: " + id));

        document.setFileName(newName);

        return documentRepository.save(document);
    }

    public List<Document> searchDocuments(String keyword) {

        User currentUser = securityUtils.getCurrentUser();
        return documentRepository.findByFileNameContainingIgnoreCaseAndUser(keyword, currentUser);
    }

    public Page<Document> getDocuments(int page, int size) {

        User currentUser = securityUtils.getCurrentUser();
        return documentRepository.findByUser(
                currentUser,
                PageRequest.of(page, size)
        );
    }

    public DocumentStats getStatistics() {

        User currentUser = securityUtils.getCurrentUser();
        DocumentStats stats = documentRepository.fetchStatisticsByUser(currentUser);

        return stats != null ? stats : new DocumentStats(0L, 0L, 0L);
    }
}