package com.knowflow.mindmap.controller;

import com.knowflow.mindmap.dto.MindMapNode;
import com.knowflow.mindmap.dto.MindMapRequest;
import com.knowflow.mindmap.service.MindMapService;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/mindmap")
public class MindMapController {

    private final MindMapService mindMapService;

    public MindMapController(
            MindMapService mindMapService
    ) {
        this.mindMapService = mindMapService;
    }

    @PostMapping
    public MindMapNode generate(
            @RequestBody MindMapRequest request
    ) {
        return mindMapService.generateMindMap(request);
    }
}