package com.knowflow.document.retrieval;

import com.knowflow.common.util.SecurityUtils;
import com.knowflow.config.RagProperties;
import com.knowflow.user.entity.User;
import org.springframework.ai.document.Document;
import org.springframework.ai.vectorstore.SearchRequest;
import org.springframework.ai.vectorstore.VectorStore;
import org.springframework.ai.vectorstore.filter.FilterExpressionBuilder;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class RetrievalService {

    private final VectorStore vectorStore;
    private final RagProperties ragProperties;
    private final SecurityUtils securityUtils;

    public RetrievalService(VectorStore vectorStore,
                            RagProperties ragProperties,
                            SecurityUtils securityUtils) {

        this.vectorStore = vectorStore;
        this.ragProperties = ragProperties;
        this.securityUtils = securityUtils;
    }

    public List<Document> retrieve(String question) {

        User currentUser = securityUtils.getCurrentUser();
        var b = new FilterExpressionBuilder();

        SearchRequest request = SearchRequest.builder()
                .query(question)
                .topK(ragProperties.topK())
                .similarityThreshold(ragProperties.similarityThreshold())
                .filterExpression(b.eq("userId", currentUser.getId().toString()).build())
                .build();

        return vectorStore.similaritySearch(request);
    }

    public List<Document> retrieve(String question,
                                   List<String> documentIds) {

        User currentUser = securityUtils.getCurrentUser();
        var b = new FilterExpressionBuilder();

        SearchRequest request = SearchRequest.builder()
                .query(question)
                .topK(ragProperties.topK())
                .similarityThreshold(ragProperties.similarityThreshold())
                .filterExpression(
                        b.and(
                                b.eq("userId", currentUser.getId().toString()),
                                b.eq("documentId", documentIds.get(0))
                        ).build()
                )
                .build();

        return vectorStore.similaritySearch(request);
    }
}