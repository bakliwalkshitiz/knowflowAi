package com.knowflow.document.parser;

import org.apache.tika.Tika;
import org.apache.tika.exception.TikaException;
import org.springframework.stereotype.Component;

import java.io.File;
import java.io.IOException;

@Component
public class DocumentParser {

    private final Tika tika = new Tika();

    public String extractText(File file) {

        try {
            return tika.parseToString(file);
        } catch (IOException | TikaException e) {
            throw new RuntimeException("Failed to parse document", e);
        }
    }
}