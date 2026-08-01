package com.knowflow.interview.dto;

import java.util.List;

public record InterviewResponse(

        List<InterviewQuestion> questions

) {
}