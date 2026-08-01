package com.knowflow.ai.tools;

import lombok.extern.slf4j.Slf4j;
import org.springframework.ai.tool.annotation.Tool;
import org.springframework.stereotype.Component;

@Slf4j
@Component
public class UnitConverterTool {

    @Tool(description = "Convert temperatures between Celsius, Fahrenheit, and Kelvin")
    public String convertTemperature(double value, String fromUnit, String toUnit) {
        log.info("UnitConverterTool -> convertTemperature value={}, from={}, to={}", value, fromUnit, toUnit);
        String from = fromUnit.trim().toUpperCase();
        String to = toUnit.trim().toUpperCase();

        double celsius;
        if (from.startsWith("C")) celsius = value;
        else if (from.startsWith("F")) celsius = (value - 32) * 5 / 9;
        else if (from.startsWith("K")) celsius = value - 273.15;
        else return "Unsupported input temperature unit: " + fromUnit;

        double result;
        if (to.startsWith("C")) result = celsius;
        else if (to.startsWith("F")) result = (celsius * 9 / 5) + 32;
        else if (to.startsWith("K")) result = celsius + 273.15;
        else return "Unsupported output temperature unit: " + toUnit;

        return String.format("%.2f %s = %.2f %s", value, fromUnit, result, toUnit);
    }

    @Tool(description = "Convert digital storage units (Bytes, KB, MB, GB, TB)")
    public String convertStorage(double value, String fromUnit, String toUnit) {
        log.info("UnitConverterTool -> convertStorage value={}, from={}, to={}", value, fromUnit, toUnit);
        double bytes = switch (fromUnit.trim().toUpperCase()) {
            case "B", "BYTES" -> value;
            case "KB" -> value * 1024;
            case "MB" -> value * 1024 * 1024;
            case "GB" -> value * 1024 * 1024 * 1024;
            case "TB" -> value * 1024 * 1024 * 1024 * 1024;
            default -> -1;
        };

        if (bytes < 0) return "Unsupported storage unit: " + fromUnit;

        double result = switch (toUnit.trim().toUpperCase()) {
            case "B", "BYTES" -> bytes;
            case "KB" -> bytes / 1024;
            case "MB" -> bytes / (1024 * 1024);
            case "GB" -> bytes / (1024 * 1024 * 1024);
            case "TB" -> bytes / (1024 * 1024 * 1024 * 1024);
            default -> -1;
        };

        if (result < 0) return "Unsupported target storage unit: " + toUnit;

        return String.format("%.2f %s = %.4f %s", value, fromUnit, result, toUnit);
    }
}
