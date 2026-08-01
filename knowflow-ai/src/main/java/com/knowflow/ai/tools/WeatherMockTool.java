package com.knowflow.ai.tools;

import lombok.extern.slf4j.Slf4j;
import org.springframework.ai.tool.annotation.Tool;
import org.springframework.stereotype.Component;

@Slf4j
@Component
public class WeatherMockTool {

    @Tool(description = "Get current weather report and temperature for a given city")
    public String getWeather(String city) {
        log.info("WeatherMockTool -> getWeather for city: {}", city);
        if (city == null || city.isBlank()) return "Please provide a valid city name.";

        String cityLower = city.trim().toLowerCase();
        if (cityLower.contains("delhi") || cityLower.contains("mumbai") || cityLower.contains("bangalore")) {
            return String.format("Weather in %s: 29°C, Partly Cloudy, Humidity 65%%, Wind 12 km/h", city);
        } else if (cityLower.contains("london") || cityLower.contains("paris") || cityLower.contains("new york")) {
            return String.format("Weather in %s: 18°C, Mostly Sunny, Humidity 45%%, Wind 18 km/h", city);
        }

        return String.format("Weather in %s: 24°C, Clear Skies, Humidity 50%%, Wind 10 km/h", city);
    }
}
