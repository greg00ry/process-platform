# Process Platform

On-premise platforma do budowy aplikacji procesowych: warstwa formularzy, silnik procesowy BPMN/DMN oraz integracja z systemami dokumentowymi (ECM), spięte event-drivenowo przez Kafkę.

Projekt jest na etapie MVP — kierunek dalszego rozwoju (kolejne moduły, integracje) jest jeszcze otwarty.

## Architektura

```
przeglądarka (dowolny CMS/frontend)
      │  hx-get "/widget/formio/:schemaId"
      ▼
┌────────────────────┐        ┌──────────┐        ┌──────────────────────┐        ┌───────────────┐
│  htmx/              │  Kafka  │  Kafka   │        │  loan-application/    │  Kafka  │  ecm-adapter/  │
│  Node/Express BFF    │──────► │  (event  │───────►│  Spring Boot +        │──────► │  Go            │
│  form.io widget       │        │   bus)   │        │  Operaton (BPMN/DMN)  │        │  konsumuje     │
└────────────────────┘        └──────────┘        └──────────────────────┘        │  zdarzenia,    │
                                                                                     │  woła ECM      │
                                                                                     └───────────────┘
```

Formularz (widget) nigdy nie woła silnika procesowego ani ECM bezpośrednio — całe pośrednictwo idzie przez Kafkę, żeby nie wystawiać wewnętrznych systemów publicznie.

## Komponenty

| Katalog | Co to jest | Stack |
|---|---|---|
| [`htmx/`](htmx/README.md) | BFF renderujący formularze schema-driven (form.io), osadzany przez htmx w dowolnym frontendzie | Node.js, TypeScript, Express |
| [`loan-application/`](loan-application/README.md) | Silnik procesu: triage wniosku kredytowego (credit-score, DMN, routing przez BPMN, human task dla underwritera) | Java 21, Spring Boot, Operaton (BPMN/DMN) |
| [`loan-application/ecm-adapter/`](loan-application/ecm-adapter) | Mikroserwis konsumujący zdarzenia dokumentowe z Kafki i przekazujący je do ECM | Go |

## Uruchomienie

Każdy komponent ma własne instrukcje w swoim README. W skrócie:

```bash
# widget formularzy
cd htmx
npm install
npm start

# proces BPMN + zależności (Postgres, WireMock, Kafka, Mailpit)
cd loan-application
docker compose up -d
./mvnw spring-boot:run
```

## Status

MVP, rozwijany iteracyjnie, commit po commicie. Poszczególne README opisują świadomie odłożone ograniczenia (np. brak auth w widgecie, zapis do pliku zamiast bazy).
