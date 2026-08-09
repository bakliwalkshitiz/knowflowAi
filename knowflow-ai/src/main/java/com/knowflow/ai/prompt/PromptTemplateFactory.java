package com.knowflow.ai.prompt;

import com.knowflow.common.enums.PromptType;
import org.springframework.stereotype.Component;

@Component
public class PromptTemplateFactory {

    public String buildPrompt(PromptType type, String message) {

        if (type == PromptType.CHAT) {
            return message;
        }

        if (type == PromptType.FLASHCARD) {
            return """
                    User Request / Topic: %s

                    INSTRUCTIONS FOR FLASHCARDS:
                    Generate 5 to 10 comprehensive flashcards based on the user request / provided text.
                    You MUST format your entire response as a single valid JSON array inside a ```json ``` block with objects containing "id", "front", and "back":
                    ```json
                    [
                      {
                        "id": 1,
                        "front": "What is ...?",
                        "back": "Detailed answer / explanation..."
                      }
                    ]
                    ```
                    Do not print any headers, disclaimers, or metadata outside the JSON block.
                    """.formatted(message);
        }

        if (type == PromptType.SYSTEM_DESIGN) {
            return """
                    User Request / Topic: %s

                    INSTRUCTIONS FOR SYSTEM DESIGN (LLD & HLD):
                    Generate a complete, production-grade System Design document containing both LLD and HLD without adding any mode headers or metadata prefixes:

                    ### 1. Low-Level Design (LLD)
                    - Provide a valid Mermaid UML Class Diagram inside a ```mermaid classDiagram ``` code block.
                    - STRICT MERMAID CLASS DIAGRAM SYNTAX RULES:
                      - Use standard class declaration syntax: `class ClassName { +type field }`
                      - Do NOT place quotes or spaces in class names.
                      - Use valid class relationships: `ClassA --|> ClassB` (inheritance), `ClassA *-- ClassB` (composition), `ClassA --> ClassB` (association).
                    - Explain design patterns used (e.g. Factory, Strategy, Singleton, Observer).

                    ### 2. High-Level Design (HLD)
                    - Provide a valid Mermaid System Architecture Diagram inside a ```mermaid graph TD ``` code block.
                    - STRICT MERMAID GRAPH SYNTAX RULES:
                      - Use simple node IDs with alphanumeric labels: `Client["Mobile / Web Client"] --> Gateway["API Gateway"]`
                      - Connect nodes using clean arrows: `Gateway --> AuthSvc["Auth Service"]`
                      - Show components: Client -> API Gateway / Load Balancer -> Microservices -> Cache (Redis) -> DB (PostgreSQL) -> Queue (Kafka).
                    - Explain Data Flow, Caching Strategy, Database Schema & Scalability Bottlenecks.
                    """.formatted(message);
        }

        if (type == PromptType.MINDMAP) {
            return """
                    User Request / Topic: %s

                    INSTRUCTIONS FOR MIND MAP:
                    Generate a visual Mind Map diagram for the topic.
                    You MUST output a valid Mermaid mindmap diagram inside a ```mermaid mindmap ``` block.

                    STRICT MERMAID MINDMAP SYNTAX RULES:
                    - Start with `mindmap` header line.
                    - Root node at center: `root((Topic))` or `root[Topic]`.
                    - Level 1 indentation for main entities / categories.
                    - Level 2 and 3 indentation for attributes, features, and sub-topics.
                    - Keep node names clean, concise, and readable.
                    - Do NOT use special HTML tags or unsupported symbols in node names.

                    Example structure:
                    ```mermaid
                    mindmap
                      root((Agentic AI))
                        Core Architecture
                          Autonomous Decision Engine
                          Tool Calling & Execution
                          Memory Management
                        Key Capabilities
                          Self Reflection & Planning
                          Multi Agent Collaboration
                        Applications
                          Coding Assistants
                          Autonomous Systems
                    ```

                    Below the diagram, provide a brief 2-3 sentence overview summary of the mind map.
                    """.formatted(message);
        }

        if (type == PromptType.QUIZ) {
            return """
                    User Request / Topic: %s

                    INSTRUCTIONS FOR QUIZ:
                    Generate 5 interactive quiz questions based on the topic.
                    Format each question clearly as:

                    Question 1: [Question text]
                    Answer: [Detailed answer and explanation]

                    Question 2: [Question text]
                    Answer: [Detailed answer and explanation]

                    Do not print any disclaimers or mode headers.
                    """.formatted(message);
        }

        if (type == PromptType.SUMMARY) {
            return """
                    User Request / Topic: %s

                    INSTRUCTIONS FOR SUMMARY:
                    Provide a structured summary for the topic:
                    ## Executive Summary
                    ## Key Takeaways (5 bullet points)
                    ## Core Concepts & Details
                    """.formatted(message);
        }

        if (type == PromptType.INTERVIEW) {
            return """
                    User Request / Topic: %s

                    INSTRUCTIONS FOR INTERVIEW PREP:
                    Generate 5 technical interview questions with model answers and key talking points:

                    Question 1: [Interview Question]
                    Answer: [Model Answer & Key Concepts to Mention]

                    Question 2: [Interview Question]
                    Answer: [Model Answer & Key Concepts to Mention]
                    """.formatted(message);
        }

        String modeName = type.name();

        return """
                User Request: %s

                AI Instruction: Perform the %s task directly following the user's request. Do NOT print any mode headers, prefixes, or system tag lines (such as '[Applied Mode: ...]'), output the answer cleanly.
                """.formatted(message, modeName);
    }
}