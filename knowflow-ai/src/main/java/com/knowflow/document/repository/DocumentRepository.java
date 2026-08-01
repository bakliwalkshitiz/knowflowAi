package com.knowflow.document.repository;

import com.knowflow.document.dto.DocumentStats;
import com.knowflow.document.entity.Document;
import com.knowflow.user.entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface DocumentRepository extends JpaRepository<Document, UUID> {

    List<Document> findByUser(User user);

    Optional<Document> findByIdAndUser(UUID id, User user);

    List<Document> findByFileNameContainingIgnoreCaseAndUser(String keyword, User user);

    Page<Document> findByUser(User user, Pageable pageable);

    @Query("SELECT new com.knowflow.document.dto.DocumentStats(COUNT(d), COALESCE(SUM(d.chunkCount), 0L), COALESCE(SUM(d.fileSize), 0L)) FROM Document d WHERE d.user = :user")
    DocumentStats fetchStatisticsByUser(@Param("user") User user);

}