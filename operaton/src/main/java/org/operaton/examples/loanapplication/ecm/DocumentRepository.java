package org.operaton.examples.loanapplication.ecm;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface DocumentRepository extends JpaRepository<Document, UUID> {

    List<Document> findByProcessInstanceId(String processInstanceId);

    List<Document> findByStatus(DocumentStatus status);
}
