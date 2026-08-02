package com.knowflow.user.controller;

import com.knowflow.common.util.SecurityUtils;
import com.knowflow.user.entity.User;
import com.knowflow.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@Slf4j
@RestController
@RequestMapping({"/api/v1/user", "/user"})
@RequiredArgsConstructor
public class UserController {

    private final UserRepository userRepository;
    private final SecurityUtils securityUtils;

    @GetMapping("/me")
    public ResponseEntity<Map<String, Object>> getCurrentUser() {
        User user = securityUtils.getCurrentUser();
        return ResponseEntity.ok(Map.of(
                "id", user.getId(),
                "name", user.getName(),
                "email", user.getEmail(),
                "role", user.getRole()
        ));
    }

    @PutMapping("/profile")
    public ResponseEntity<Map<String, Object>> updateProfile(@RequestBody Map<String, String> request) {
        User currentUser = securityUtils.getCurrentUser();
        String newName = request.get("name");
        if (newName != null && !newName.isBlank()) {
            currentUser.setName(newName.trim());
            userRepository.save(currentUser);
            log.info("Updated display name for user {} to '{}'", currentUser.getEmail(), newName);
        }
        return ResponseEntity.ok(Map.of(
                "id", currentUser.getId(),
                "name", currentUser.getName(),
                "email", currentUser.getEmail(),
                "role", currentUser.getRole()
        ));
    }
}
