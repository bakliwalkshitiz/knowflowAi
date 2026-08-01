package com.knowflow.document.parser;

import lombok.extern.slf4j.Slf4j;
import org.apache.tika.Tika;
import org.springframework.stereotype.Component;

import java.io.File;
import java.nio.file.Files;

@Slf4j
@Component
public class DocumentParser {

    private final Tika tika = new Tika();

    public String extractText(File file) {
        String text = null;

        // 1. Try Apache Tika parsing
        try {
            text = tika.parseToString(file);
        } catch (Exception e) {
            log.warn("Tika failed to parse document '{}': {}", file.getName(), e.getMessage());
        }

        // 2. Fallback to direct text file reading if Tika returned null or blank
        if (text == null || text.isBlank()) {
            try {
                text = Files.readString(file.toPath());
            } catch (Exception e) {
                log.warn("Fallback text reading failed for '{}': {}", file.getName(), e.getMessage());
            }
        }

        // 3. Ultimate fallback to prevent upload crashes
        if (text == null || text.isBlank()) {
            text = "Document File: " + file.getName() + "\nContent: Unable to extract text from binary format.";
        }

        // 4. Sanitize NUL bytes (\0 / \u0000) for PostgreSQL UTF-8 compatibility
        return text.replace("\u0000", "").replace("\0", "");
    }
}