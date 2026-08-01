package com.knowflow.ai.service;

import org.springframework.ai.vectorstore.VectorStore;
import org.springframework.ai.vectorstore.filter.FilterExpressionBuilder;
import org.springframework.stereotype.Service;

@Service
public class VectorStoreService {

    private final VectorStore vectorStore;

    public VectorStoreService(VectorStore vectorStore) {
        this.vectorStore = vectorStore;
    }

    public void deleteDocumentEmbeddings(String documentId) {

        var b = new FilterExpressionBuilder();

        vectorStore.delete(b.eq("documentId", documentId).build().toString());
    }
}