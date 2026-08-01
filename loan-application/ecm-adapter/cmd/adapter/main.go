package main

import (
	"context"
	"log/slog"
	"net/http"
	"os"
	"strings"

	"ecm-adapter/internal/ecm"
	"ecm-adapter/internal/events"
	"ecm-adapter/internal/server"
)

func main() {
	logger := slog.New(slog.NewTextHandler(os.Stdout, nil))

	ecmBaseURL := envOr("ECM_BASE_URL", "http://localhost:8080")
	addr := envOr("ADAPTER_ADDR", ":8090")
	kafkaBrokers := strings.Split(envOr("KAFKA_BROKERS", "localhost:9092"), ",")
	eventsTopic := envOr("ECM_EVENTS_TOPIC", "ecm.document.events")

	consumer := events.NewConsumer(kafkaBrokers, eventsTopic, "ecm-adapter", logger)
	go consumer.Run(context.Background())

	srv := server.New(ecm.NewClient(ecmBaseURL), logger)

	logger.Info("ecm-adapter starting", "addr", addr, "ecm", ecmBaseURL, "kafka", kafkaBrokers)
	if err := http.ListenAndServe(addr, srv.Handler()); err != nil {
		logger.Error("server stopped", "error", err)
		os.Exit(1)
	}
}

func envOr(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}
