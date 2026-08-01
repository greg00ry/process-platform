package org.operaton.examples.loanapplication.ecm;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Component;

@Component
public class DocumentEventPublisher {

    private static final Logger log = LoggerFactory.getLogger(DocumentEventPublisher.class);

    private final KafkaTemplate<String, String> kafkaTemplate;
    private final ObjectMapper objectMapper;
    private final String topic;

    public DocumentEventPublisher(KafkaTemplate<String, String> kafkaTemplate,
                                  ObjectMapper objectMapper,
                                  @Value("${ecm.events.topic}") String topic) {
        this.kafkaTemplate = kafkaTemplate;
        this.objectMapper = objectMapper;
        this.topic = topic;
    }

    public void publish(DocumentEvent event) {
        try {
            // key = documentId so all events of one document stay ordered in one partition
            String key = event.documentId().toString();
            String payload = objectMapper.writeValueAsString(event);
            kafkaTemplate.send(topic, key, payload).whenComplete((result, ex) -> {
                if (ex != null) {
                    log.error("Failed to publish {} for document {}", event.eventType(), key, ex);
                } else {
                    log.info("Published {} for document {} to {}", event.eventType(), key, topic);
                }
            });
        } catch (Exception e) {
            log.error("Could not serialize document event {}", event, e);
        }
    }
}
