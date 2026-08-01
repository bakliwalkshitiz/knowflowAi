package com.knowflow.user.controller;

import com.knowflow.common.util.SecurityUtils;
import com.knowflow.user.dto.ApiKeyRequest;
import com.knowflow.user.dto.ApiKeyResponse;
import com.knowflow.user.entity.User;
import com.knowflow.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/user")
@RequiredArgsConstructor
public class UserController {

    private final UserRepository userRepository;
    private final SecurityUtils securityUtils;

    @GetMapping("/api-key")
    public ResponseEntity<ApiKeyResponse> getApiKey() {
        User user = securityUtils.getCurrentUser();
        String key = user.getApiKey();
        boolean isConfigured = key != null && !key.isBlank();
        return ResponseEntity.ok(new ApiKeyResponse(key != null ? key : "", isConfigured));
    }

    @PostMapping("/api-key")
    public ResponseEntity<ApiKeyResponse> updateApiKey(@RequestBody ApiKeyRequest request) {
        User user = securityUtils.getCurrentUser();
        String newKey = request != null && request.apiKey() != null ? request.apiKey().trim() : "";
        user.setApiKey(newKey);
        userRepository.save(user);
        return ResponseEntity.ok(new ApiKeyResponse(newKey, !newKey.isBlank()));
    }
}
