package com.knowflow.mindmap.dto;

import java.util.List;

public record MindMapNode(

        String title,
        List<MindMapNode> children

) {
}