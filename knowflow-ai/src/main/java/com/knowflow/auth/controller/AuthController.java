package com.knowflow.auth.controller;

import com.knowflow.auth.dto.AuthResponse;
import com.knowflow.auth.dto.LoginRequest;
import com.knowflow.auth.dto.RegisterRequest;
import com.knowflow.auth.service.AuthService;
import jakarta.validation.Valid;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

@Slf4j
@RestController
@RequestMapping({"/api/v1/auth", "/auth"})
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/register")
    @ResponseStatus(HttpStatus.CREATED)
    public AuthResponse register(@Valid @RequestBody RegisterRequest request) {
        log.info("Processing registration request for email: {}", request != null ? request.email() : "null");
        return authService.register(request);
    }

    @PostMapping("/login")
    public AuthResponse login(@Valid @RequestBody LoginRequest request) {
        log.info("Processing login request for email: {}", request != null ? request.email() : "null");
        return authService.login(request);
    }
}
