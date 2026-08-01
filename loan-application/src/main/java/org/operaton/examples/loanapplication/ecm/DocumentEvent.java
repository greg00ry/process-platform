package org.operaton.examples.loanapplication.ecm;

import java.time.Instant;
import java.util.UUID;

public record DocumentEvent(
        String eventType,
        UUID documentId,
        String fileName,
        DocumentType type,
        DocumentStatus status,
        DocumentStatus previousStatus,
        String processInstanceId,
        Instant occurredAt) {

    static DocumentEvent uploaded(Document document) {
        return new DocumentEvent("DOCUMENT_UPLOADED", document.getId(), document.getFileName(),
                document.getType(), document.getStatus(), null,
                document.getProcessInstanceId(), Instant.now());
    }

    static DocumentEvent statusChanged(Document document, DocumentStatus previousStatus) {
        return new DocumentEvent("DOCUMENT_STATUS_CHANGED", document.getId(), document.getFileName(),
                document.getType(), document.getStatus(), previousStatus,
                document.getProcessInstanceId(), Instant.now());
    }
}
