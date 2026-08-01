// Package events consumes ECM document events from Kafka. For now the
// consumer only logs what it receives; later it can notify the BPMN
// process (e.g. correlate a message event).
package events

import (
	"context"
	"encoding/json"
	"log/slog"
	"time"

	"github.com/segmentio/kafka-go"
)

// DocumentEvent mirrors the JSON published by the Java DocumentEventPublisher.
type DocumentEvent struct {
	EventType         string    `json:"eventType"`
	DocumentID        string    `json:"documentId"`
	FileName          string    `json:"fileName"`
	Type              string    `json:"type"`
	Status            string    `json:"status"`
	PreviousStatus    string    `json:"previousStatus"`
	ProcessInstanceID string    `json:"processInstanceId"`
	OccurredAt        time.Time `json:"occurredAt"`
}

type Consumer struct {
	reader *kafka.Reader
	log    *slog.Logger
}

func NewConsumer(brokers []string, topic, groupID string, logger *slog.Logger) *Consumer {
	return &Consumer{
		reader: kafka.NewReader(kafka.ReaderConfig{
			Brokers: brokers,
			Topic:   topic,
			GroupID: groupID,
		}),
		log: logger,
	}
}

// Run blocks reading messages until ctx is cancelled.
func (c *Consumer) Run(ctx context.Context) {
	defer c.reader.Close()
	c.log.Info("kafka consumer started", "topic", c.reader.Config().Topic, "group", c.reader.Config().GroupID)
	for {
		msg, err := c.reader.ReadMessage(ctx)
		if err != nil {
			if ctx.Err() != nil {
				return
			}
			c.log.Error("kafka read failed", "error", err)
			time.Sleep(2 * time.Second)
			continue
		}
		var event DocumentEvent
		if err := json.Unmarshal(msg.Value, &event); err != nil {
			c.log.Error("cannot parse document event", "error", err, "raw", string(msg.Value))
			continue
		}
		c.log.Info("document event received",
			"eventType", event.EventType,
			"documentId", event.DocumentID,
			"file", event.FileName,
			"status", event.Status,
			"previousStatus", event.PreviousStatus,
			"caseId", event.ProcessInstanceID,
			"partition", msg.Partition,
			"offset", msg.Offset)
	}
}
