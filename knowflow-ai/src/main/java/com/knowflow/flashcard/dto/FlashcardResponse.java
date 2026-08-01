package com.knowflow.flashcard.dto;

import java.util.List;

public record FlashcardResponse(
        List<Flashcard> flashcards
) {
}