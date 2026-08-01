package com.knowflow.common.util;

import com.knowflow.common.exception.ResourceNotFoundException;
import com.knowflow.user.entity.User;
import com.knowflow.user.repository.UserRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

@Slf4j
@Component
public class SecurityUtils {

    private final UserRepository userRepository;

    public SecurityUtils(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    public String getCurrentUserEmail() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated() || "anonymousUser".equals(authentication.getName())) {
            log.warn("No authenticated principal found in SecurityContextHolder");
            throw new IllegalStateException("No authenticated user found in security context");
        }
        return authentication.getName();
    }

    public User getCurrentUser() {
        String email = getCurrentUserEmail();
        return userRepository.findByEmail(email)
                .orElseThrow(() -> {
                    log.error("User record not found in PostgreSQL for email: {}", email);
                    return new ResourceNotFoundException("Authenticated user not found with email: " + email);
                });
    }
}
