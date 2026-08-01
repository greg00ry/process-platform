package org.operaton.examples.loanapplication.ecm;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.NoSuchElementException;
import java.util.UUID;

@Service
@Transactional
public class DocumentService {

    private static final Logger log = LoggerFactory.getLogger(DocumentService.class);

    private final DocumentRepository repository;
    private final DocumentEventPublisher eventPublisher;

    public DocumentService(DocumentRepository repository, DocumentEventPublisher eventPublisher) {
        this.repository = repository;
        this.eventPublisher = eventPublisher;
    }

    public Document upload(String fileName, DocumentType type, String mimeType, byte[] content,
                           String uploadedBy, String processInstanceId) {
        Document document = new Document(fileName, type, mimeType, content, uploadedBy, processInstanceId);
        document = repository.save(document);
        log.info("ECM: stored document {} ({}, {} bytes) uploaded by {}",
                document.getId(), type, document.getSizeBytes(), uploadedBy);
        eventPublisher.publish(DocumentEvent.uploaded(document));
        return document;
    }

    @Transactional(readOnly = true)
    public Document get(UUID id) {
        return repository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Document not found: " + id));
    }

    @Transactional(readOnly = true)
    public List<Document> list(String processInstanceId, DocumentStatus status) {
        if (processInstanceId != null) {
            return repository.findByProcessInstanceId(processInstanceId);
        }
        if (status != null) {
            return repository.findByStatus(status);
        }
        return repository.findAll();
    }

    public Document changeStatus(UUID id, DocumentStatus target) {
        Document document = get(id);
        DocumentStatus previous = document.getStatus();
        document.changeStatus(target);
        log.info("ECM: document {} status {} -> {}", id, previous, target);
        eventPublisher.publish(DocumentEvent.statusChanged(document, previous));
        return document;
    }
}
