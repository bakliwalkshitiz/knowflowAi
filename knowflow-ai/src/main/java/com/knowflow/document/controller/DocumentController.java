package com.knowflow.document.controller;

import com.knowflow.document.dto.DocumentStats;
import com.knowflow.document.dto.RenameDocumentRequest;
import com.knowflow.document.entity.Document;
import com.knowflow.document.service.DocumentService;
import org.apache.tika.exception.TikaException;
import org.springframework.core.io.Resource;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/documents")
public class DocumentController {

    private final DocumentService documentService;

    public DocumentController(DocumentService documentService) {
        this.documentService = documentService;
    }

    @PostMapping(
            value = "/upload",
            consumes = MediaType.MULTIPART_FORM_DATA_VALUE
    )
    public Object upload(@RequestPart MultipartFile file)
            throws IOException, TikaException {

        return documentService.upload(file);
    }

    @GetMapping
    public List<Document> getAllDocuments() {
        return documentService.getAllDocuments();
    }

    @GetMapping("/{id}")
    public Document getDocument(@PathVariable UUID id) {
        return documentService.getDocument(id);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteDocument(@PathVariable UUID id) throws IOException {
        documentService.deleteDocument(id);
    }

    @GetMapping("/{id}/download")
    public ResponseEntity<Resource> downloadDocument(@PathVariable UUID id)
            throws Exception {

        Resource resource = documentService.downloadDocument(id);

        return ResponseEntity.ok()
                .header(
                        HttpHeaders.CONTENT_DISPOSITION,
                        "attachment; filename=\"" + resource.getFilename() + "\""
                )
                .body(resource);
    }

    @PatchMapping("/{id}/rename")
    public Document renameDocument(
            @PathVariable UUID id,
            @RequestBody RenameDocumentRequest request
    ) {

        return documentService.renameDocument(
                id,
                request.fileName()
        );
    }

    @GetMapping("/search")
    public List<Document> searchDocuments(
            @RequestParam String keyword
    ) {

        return documentService.searchDocuments(keyword);
    }

    @GetMapping("/page")
    public Page<Document> getDocuments(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {

        return documentService.getDocuments(page, size);
    }

    @GetMapping("/stats")
    public DocumentStats statistics() {

        return documentService.getStatistics();
    }
}