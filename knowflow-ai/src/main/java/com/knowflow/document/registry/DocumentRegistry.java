package com.knowflow.document.registry;

import com.knowflow.document.dto.DocumentInfo;
import org.springframework.stereotype.Component;

import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

@Component
public class DocumentRegistry {

    private final Map<String, DocumentInfo> documents =
            new ConcurrentHashMap<>();

    public void register(DocumentInfo info) {
        documents.put(info.documentId(), info);
    }

    public List<DocumentInfo> findAll() {
        return new ArrayList<>(documents.values());
    }

    public Optional<DocumentInfo> findById(String id) {
        return Optional.ofNullable(documents.get(id));
    }

    public void remove(String id) {
        documents.remove(id);
    }

    public boolean exists(String id) {
        return documents.containsKey(id);
    }
}