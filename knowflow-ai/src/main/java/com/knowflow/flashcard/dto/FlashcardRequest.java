package com.knowflow.flashcard.dto;

import java.util.UUID;

public record FlashcardRequest(
        UUID documentId,
        int count
) {
}