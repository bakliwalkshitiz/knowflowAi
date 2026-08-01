package com.knowflow.document.chunk;

import org.springframework.ai.document.Document;
import org.springframework.ai.transformer.splitter.TokenTextSplitter;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class DocumentChunker {

    private final TokenTextSplitter splitter =
            TokenTextSplitter.builder().build();

    public List<Document> chunk(String text) {
        String safeText = (text == null || text.isBlank()) ? "Document content is empty." : text;
        Document document = new Document(safeText);
        List<Document> chunks = splitter.split(document);
        return (chunks != null && !chunks.isEmpty()) ? chunks : List.of(document);
    }
}