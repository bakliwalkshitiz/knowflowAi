package com.knowflow.ai.chat.repository;

import com.knowflow.ai.chat.entity.ChatHistory;
import com.knowflow.user.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface ChatHistoryRepository extends JpaRepository<ChatHistory, UUID> {

    List<ChatHistory> findByUserAndConversationIdOrderByCreatedAtAsc(
            User user,
            String conversationId
    );

    List<ChatHistory> findByUserOrderByCreatedAtDesc(User user);
}
