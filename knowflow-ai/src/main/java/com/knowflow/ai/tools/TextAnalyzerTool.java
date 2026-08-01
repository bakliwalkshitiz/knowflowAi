package com.knowflow.ai.tools;

import lombok.extern.slf4j.Slf4j;
import org.springframework.ai.tool.annotation.Tool;
import org.springframework.stereotype.Component;

@Slf4j
@Component
public class TextAnalyzerTool {

    @Tool(description = "Analyze text to calculate word count, character count, and estimated reading time")
    public String analyzeTextMetrics(String text) {
        log.info("TextAnalyzerTool -> analyzeTextMetrics called");
        if (text == null || text.isBlank()) {
            return "Empty text provided.";
        }
        String[] words = text.trim().split("\\s+");
        int wordCount = words.length;
        int charCount = text.length();
        double readingTimeMin = Math.ceil(wordCount / 200.0);

        return String.format("Word Count: %d | Character Count: %d | Est. Reading Time: %.0f min",
                wordCount, charCount, readingTimeMin);
    }
}
