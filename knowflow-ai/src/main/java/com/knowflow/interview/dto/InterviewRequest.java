package com.knowflow.interview.dto;

import java.util.UUID;

public record InterviewRequest(

        UUID documentId,
        InterviewLevel level,
        int count

) {
}