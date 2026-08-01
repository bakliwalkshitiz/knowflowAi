package com.knowflow.ai.tools;

import lombok.extern.slf4j.Slf4j;
import org.springframework.ai.tool.annotation.Tool;
import org.springframework.stereotype.Component;

@Slf4j
@Component
public class CodeFormatterTool {

    @Tool(description = "Analyze and count lines, characters, and structural metrics for a block of source code")
    public String analyzeCodeStructure(String code, String language) {
        log.info("CodeFormatterTool -> analyzeCodeStructure called for language: {}", language);
        int lines = code == null ? 0 : code.split("\r\n|\r|\n").length;
        int chars = code == null ? 0 : code.length();
        int functions = code == null ? 0 : code.split("function|def|public|class|void").length - 1;
        return String.format("Language: %s | Lines: %d | Characters: %d | Key Structures Detected: %d",
                language, lines, chars, Math.max(1, functions));
    }
}
