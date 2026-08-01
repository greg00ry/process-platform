package org.operaton.examples.loanapplication.ecm;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "ecm_document")
public class Document {

    @Id
    @GeneratedValue
    private UUID id;

    @Column(nullable = false)
    private String fileName;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private DocumentType type;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private DocumentStatus status;

    @Column(nullable = false)
    private String mimeType;

    @Column(nullable = false)
    private long sizeBytes;

    @Column(nullable = false)
    private byte[] content;

    private String uploadedBy;

    // link to a BPMN process instance; unused until the ECM is wired into the process
    private String processInstanceId;

    @Column(nullable = false)
    private Instant createdAt;

    @Column(nullable = false)
    private Instant updatedAt;

    protected Document() {
    }

    public Document(String fileName, DocumentType type, String mimeType, byte[] content,
                    String uploadedBy, String processInstanceId) {
        this.fileName = fileName;
        this.type = type;
        this.status = DocumentStatus.UPLOADED;
        this.mimeType = mimeType;
        this.content = content;
        this.sizeBytes = content.length;
        this.uploadedBy = uploadedBy;
        this.processInstanceId = processInstanceId;
        this.createdAt = Instant.now();
        this.updatedAt = this.createdAt;
    }

    public void changeStatus(DocumentStatus target) {
        if (!status.canTransitionTo(target)) {
            throw new IllegalStateException(
                    "Illegal document status transition: " + status + " -> " + target);
        }
        this.status = target;
        this.updatedAt = Instant.now();
    }

    public UUID getId() {
        return id;
    }

    public String getFileName() {
        return fileName;
    }

    public DocumentType getType() {
        return type;
    }

    public DocumentStatus getStatus() {
        return status;
    }

    public String getMimeType() {
        return mimeType;
    }

    public long getSizeBytes() {
        return sizeBytes;
    }

    public byte[] getContent() {
        return content;
    }

    public String getUploadedBy() {
        return uploadedBy;
    }

    public String getProcessInstanceId() {
        return processInstanceId;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }
}
