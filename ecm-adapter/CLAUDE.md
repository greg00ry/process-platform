# ecm-adapter

Go (stdlib `net/http`, bez frameworka). Konsumuje z Kafki topic `ecm.document.events` (publikowany przez `operaton`'s `DocumentEventPublisher`) i wystawia własne REST API (`/adapter/v1/documents*`), które proxy'uje do ECM-symulacji w `operaton` (`GET/POST http://<ECM_BASE_URL>/api/ecm/documents*`).

## Konfiguracja — tylko env vary, brak plików config

`cmd/adapter/main.go`, funkcja `envOr`: `ECM_BASE_URL` (domyślnie `http://localhost:8080` — w compose: `http://operaton:8080`), `ADAPTER_ADDR` (domyślnie `:8090`), `KAFKA_BROKERS`, `ECM_EVENTS_TOPIC`. Nie dodawaj pliku configu — trzymaj się env varów, spójnie z resztą serwisu.

## Struktura

- `internal/events/consumer.go` — konsument Kafki, na razie tylko loguje odebrane zdarzenia (komentarz w kodzie: docelowo ma korelować z BPMN message event).
- `internal/ecm/client.go` — HTTP klient do ECM API operatona.
- `internal/server/server.go` — HTTP handlery `/adapter/v1/documents*` + `/healthz`.
- `internal/model/model.go` — mapowanie między słownictwem "adapter" (`state`) a "ecm" (`status`).

## Brak testów

Świadomy brak, śledzony w root `ROADMAP.md` — nie dodawaj auth/testów/retry-logiki tutaj bez wyraźnej prośby, to osobny etap.
