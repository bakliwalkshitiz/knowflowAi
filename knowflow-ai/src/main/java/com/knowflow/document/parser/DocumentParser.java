package com.knowflow.document.parser;

import lombok.extern.slf4j.Slf4j;
import org.apache.pdfbox.Loader;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.text.PDFTextStripper;
import org.apache.tika.Tika;
import org.springframework.stereotype.Component;

import java.io.File;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;

@Slf4j
@Component
public class DocumentParser {

    private final Tika tika = new Tika();

    public String extractText(File file) {
        if (file == null || !file.exists()) {
            return "";
        }

        String fileName = file.getName().toLowerCase();
        String text = null;

        // 1. Dedicated PDF Parser using Apache PDFBox for clean, fast PDF text extraction
        if (fileName.endsWith(".pdf")) {
            try (PDDocument document = Loader.loadPDF(file)) {
                PDFTextStripper stripper = new PDFTextStripper();
                text = stripper.getText(document);
                if (text != null && !text.isBlank()) {
                    log.info("PDFBox successfully extracted {} chars from '{}'", text.length(), file.getName());
                    return sanitizeText(text);
                }
            } catch (Exception e) {
                log.warn("PDFBox extraction failed for '{}': {}", file.getName(), e.getMessage());
            }
        }

        // 2. Apache Tika parsing (for DOC, DOCX, TXT, PDF fallback)
        try {
            text = tika.parseToString(file);
            if (text != null && !text.isBlank() && !text.contains("%PDF-")) {
                log.info("Tika successfully extracted {} chars from '{}'", text.length(), file.getName());
                return sanitizeText(text);
            }
        } catch (Exception e) {
            log.warn("Tika failed to parse document '{}': {}", file.getName(), e.getMessage());
        }

        // 3. Fallback ONLY for plain text files (.txt, .md, .csv, .json)
        if (fileName.endsWith(".txt") || fileName.endsWith(".md") || fileName.endsWith(".csv") || fileName.endsWith(".json")) {
            try {
                text = Files.readString(file.toPath(), StandardCharsets.UTF_8);
                if (text != null && !text.isBlank()) {
                    return sanitizeText(text);
                }
            } catch (Exception e) {
                log.warn("Text file reading failed for '{}': {}", file.getName(), e.getMessage());
            }
        }

        log.warn("Could not extract readable text from document '{}'", file.getName());
        return "Document File: " + file.getName() + "\n(Unable to extract readable text from document content)";
    }

    private String sanitizeText(String raw) {
        if (raw == null) return "";
        return raw.replace("\u0000", "").replace("\0", "").trim();
    }
}