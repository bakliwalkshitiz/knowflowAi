package com.knowflow.ai.tools;

import lombok.extern.slf4j.Slf4j;
import org.springframework.ai.tool.annotation.Tool;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

@Slf4j
@Component
public class DateTimeTool {

    @Tool(description = "Get the current date")
    public String currentDate() {
        log.debug("Tool -> currentDate() called");
        return LocalDate.now().toString();
    }

    @Tool(description = "Get the current time")
    public String currentTime() {
        log.debug("Tool -> currentTime() called");
        return LocalTime.now().toString();
    }

    @Tool(description = "Get the current date and time")
    public String currentDateTime() {
        log.debug("Tool -> currentDateTime() called");
        return LocalDateTime.now().toString();
    }
}