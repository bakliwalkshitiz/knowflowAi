package com.knowflow.ai.tools;

import lombok.extern.slf4j.Slf4j;
import org.springframework.ai.tool.annotation.Tool;
import org.springframework.stereotype.Component;

@Slf4j
@Component
public class CalculatorTool {

    @Tool(description = "Add two numbers")
    public double add(double a, double b) {
        log.debug("Tool -> add() called with a={}, b={}", a, b);
        return a + b;
    }

    @Tool(description = "Subtract second number from first number")
    public double subtract(double a, double b) {
        log.debug("Tool -> subtract() called with a={}, b={}", a, b);
        return a - b;
    }

    @Tool(description = "Multiply two numbers")
    public double multiply(double a, double b) {
        log.debug("Tool -> multiply() called with a={}, b={}", a, b);
        return a * b;
    }

    @Tool(description = "Divide first number by second number")
    public double divide(double a, double b) {

        log.debug("Tool -> divide() called with a={}, b={}", a, b);

        if (b == 0) {
            throw new IllegalArgumentException("Cannot divide by zero.");
        }

        return a / b;
    }

    @Tool(description = "Find remainder after division")
    public double modulus(double a, double b) {

        log.debug("Tool -> modulus() called with a={}, b={}", a, b);

        if (b == 0) {
            throw new IllegalArgumentException("Cannot perform modulus by zero.");
        }

        return a % b;
    }

    @Tool(description = "Raise first number to the power of second number")
    public double power(double base, double exponent) {
        log.debug("Tool -> power() called with base={}, exponent={}", base, exponent);
        return Math.pow(base, exponent);
    }

    @Tool(description = "Calculate square root of a number")
    public double squareRoot(double number) {

        log.debug("Tool -> squareRoot() called with number={}", number);

        if (number < 0) {
            throw new IllegalArgumentException("Square root of negative number is not supported.");
        }

        return Math.sqrt(number);
    }

    @Tool(description = "Return the larger of two numbers")
    public double max(double a, double b) {
        log.debug("Tool -> max() called with a={}, b={}", a, b);
        return Math.max(a, b);
    }

    @Tool(description = "Return the smaller of two numbers")
    public double min(double a, double b) {
        log.debug("Tool -> min() called with a={}, b={}", a, b);
        return Math.min(a, b);
    }

    @Tool(description = "Return absolute value of a number")
    public double absolute(double number) {
        log.debug("Tool -> absolute() called with number={}", number);
        return Math.abs(number);
    }

}