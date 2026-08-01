package org.operaton.examples.loanapplication.ecm;

import java.time.Instant;
import java.util.UUID;

public record DocumentDto(
        UUID id,
        String fileName,
        DocumentType type,
        DocumentStatus status,
        String mimeType,
        long sizeBytes,
        String uploadedBy,
        String processInstanceId,
        Instant createdAt,
        Instant updatedAt) {

    static DocumentDto from(Document document) {
        return new DocumentDto(
                document.getId(),
                document.getFileName(),
                document.getType(),
                document.getStatus(),
                document.getMimeType(),
                document.getSizeBytes(),
                document.getUploadedBy(),
                document.getProcessInstanceId(),
                document.getCreatedAt(),
                document.getUpdatedAt());
    }
}
