package com.knowflow.flashcard.controller;

import com.knowflow.flashcard.dto.FlashcardRequest;
import com.knowflow.flashcard.dto.FlashcardResponse;
import com.knowflow.flashcard.service.FlashcardService;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/flashcards")
public class FlashcardController {

    private final FlashcardService flashcardService;

    public FlashcardController(
            FlashcardService flashcardService
    ) {
        this.flashcardService = flashcardService;
    }

    @PostMapping
    public FlashcardResponse generate(
            @RequestBody FlashcardRequest request
    ) {
        return flashcardService.generateFlashcards(request);
    }
}