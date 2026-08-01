package org.operaton.examples.loanapplication.delegate;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.operaton.bpm.engine.delegate.DelegateExecution;
import org.operaton.bpm.engine.delegate.JavaDelegate;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;

import java.time.Instant;
import java.util.Base64;
import java.util.LinkedHashMap;
import java.util.Map;

@Component
public class SaveDataDelegate implements JavaDelegate {

    private static final Logger log = LoggerFactory.getLogger(SaveDataDelegate.class);

    @Value("${ecm.adapter.url:http://localhost:8090}")
    private String adapterUrl;

    private final ObjectMapper objectMapper;

    public SaveDataDelegate(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    @Override
    public void execute(DelegateExecution execution) throws Exception {
        String processInstanceId = execution.getProcessInstanceId();

        Map<String, Object> decisionRecord = new LinkedHashMap<>();
        decisionRecord.put("processInstanceId", processInstanceId);
        decisionRecord.put("loanAmount", execution.getVariable("loanAmount"));
        decisionRecord.put("creditScore", execution.getVariable("creditScore"));
        decisionRecord.put("riskLevel", execution.getVariable("riskLevel"));
        decisionRecord.put("loanDecision", execution.getVariable("loanDecision"));
        decisionRecord.put("archivedAt", Instant.now().toString());
        byte[] content = objectMapper.writeValueAsBytes(decisionRecord);

        // adapter's process-side upload contract (snake_case JSON, base64 content)
        Map<String, Object> uploadRequest = new LinkedHashMap<>();
        uploadRequest.put("name", "loan-decision-" + processInstanceId + ".json");
        uploadRequest.put("category", "other");
        uploadRequest.put("media_type", "application/json");
        uploadRequest.put("owner", "system");
        uploadRequest.put("case_id", processInstanceId);
        uploadRequest.put("content_base64", Base64.getEncoder().encodeToString(content));

        try {
            RestTemplate restTemplate = new RestTemplate();
            Map<?, ?> response = restTemplate.postForObject(
                    adapterUrl + "/adapter/v1/documents", uploadRequest, Map.class);
            Object documentId = response != null ? response.get("document_id") : null;
            execution.setVariable("ecmDocumentId", documentId != null ? documentId.toString() : null);
            log.info("Archived loan decision for process {} as ECM document {}", processInstanceId, documentId);
        } catch (RestClientException e) {
            // archiving is best-effort in the demo: don't fail the process when the adapter is down
            log.warn("Could not archive loan decision for process {} via ECM adapter: {}",
                    processInstanceId, e.getMessage());
        }
    }
}
