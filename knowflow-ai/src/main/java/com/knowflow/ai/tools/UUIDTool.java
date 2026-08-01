package com.knowflow.ai.tools;

import org.springframework.ai.tool.annotation.Tool;
import org.springframework.stereotype.Component;

import java.util.UUID;

@Component
public class UUIDTool {

    @Tool(description = "Generate a random UUID")
    public String generateUUID() {
        return UUID.randomUUID().toString();
    }
}