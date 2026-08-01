package com.knowflow.mindmap.service;

import com.knowflow.ai.rag.RagService;
import com.knowflow.mindmap.dto.MindMapNode;
import com.knowflow.mindmap.dto.MindMapRequest;
import org.springframework.ai.document.Document;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class MindMapService {

    private final RagService ragService;

    public MindMapService(RagService ragService) {
        this.ragService = ragService;
    }

    public MindMapNode generateMindMap(
            MindMapRequest request
    ) {

        List<Document> documents = ragService.getDocumentsById(
                "Generate Mind Map",
                List.of(request.documentId().toString())
        );

        return ragService.askWithCustomPrompt(
                """
                You are KnowFlow AI.

                Create a hierarchical mind map.

                Rules:
                1. Use ONLY the provided context.
                2. Do not use outside knowledge.
                3. Root node should represent the main topic.
                4. Every child should represent a major concept.
                5. Create sub-children wherever appropriate.
                """,
                """
                Context:

                %s
                """,
                documents,
                MindMapNode.class
        );
    }
}