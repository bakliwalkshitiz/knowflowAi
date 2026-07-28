package com.knowflow.ai.embedding;

import org.springframework.ai.document.Document;
import org.springframework.ai.embedding.EmbeddingModel;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class EmbeddingService {

    private final EmbeddingModel embeddingModel;

    public EmbeddingService(EmbeddingModel embeddingModel) {
        this.embeddingModel = embeddingModel;
    }

    public List<float[]> generateEmbeddings(List<Document> documents) {

        return embeddingModel.embed(
                documents.stream()
                        .map(Document::getText)
                        .toList()
        );
    }
}