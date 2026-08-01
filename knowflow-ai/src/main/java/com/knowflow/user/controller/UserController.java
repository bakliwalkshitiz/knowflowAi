package com.knowflow.user.controller;

import com.knowflow.common.util.SecurityUtils;
import com.knowflow.user.dto.ApiKeyRequest;
import com.knowflow.user.dto.ApiKeyResponse;
import com.knowflow.user.entity.User;
import com.knowflow.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@Slf4j
@RestController
@RequestMapping({"/api/v1/user", "/user"})
@RequiredArgsConstructor
public class UserController {

    private final UserRepository userRepository;
    private final SecurityUtils securityUtils;

    @GetMapping("/api-key")
    public ResponseEntity<ApiKeyResponse> getApiKey() {
        log.info("Fetching API key for current user...");
        User user = securityUtils.getCurrentUser();
        String key = user.getApiKey();
        boolean isConfigured = key != null && !key.isBlank();
        log.info("API key status for user {}: configured={}", user.getEmail(), isConfigured);
        return ResponseEntity.ok(new ApiKeyResponse(key != null ? key : "", isConfigured));
    }

    @PostMapping("/api-key")
    public ResponseEntity<ApiKeyResponse> updateApiKey(@RequestBody ApiKeyRequest request) {
        User user = securityUtils.getCurrentUser();
        String newKey = request != null && request.apiKey() != null ? request.apiKey().trim() : "";
        user.setApiKey(newKey);
        userRepository.save(user);
        log.info("Updated API key for user {}", user.getEmail());
        return ResponseEntity.ok(new ApiKeyResponse(newKey, !newKey.isBlank()));
    }
}
