# Process Platform

On-premise platforma do budowy aplikacji procesowych: warstwa formularzy, silnik procesowy BPMN/DMN oraz integracja z systemami dokumentowymi (ECM), spięte event-drivenowo przez Kafkę.

Projekt jest na etapie MVP — kierunek dalszego rozwoju (kolejne moduły, integracje) jest jeszcze otwarty.

## Architektura

```
przeglądarka (dowolny CMS/frontend)
      │  hx-get "/widget/formio/:schemaId"
      ▼
┌────────────────────┐        ┌──────────┐        ┌──────────────────────┐        ┌───────────────┐
│  htmx/              │  Kafka  │  Kafka   │        │  operaton/            │  Kafka  │  ecm-adapter/  │
│  Node/Express BFF    │──────► │  (event  │───────►│  Spring Boot +        │──────► │  Go            │
│  form.io widget       │        │   bus)   │        │  Operaton (BPMN/DMN)  │        │  konsumuje     │
└────────────────────┘        └──────────┘        └──────────────────────┘        │  zdarzenia,    │
                                                                                     │  woła ECM      │
                                                                                     └───────────────┘
```

Formularz (widget) nigdy nie woła silnika procesowego ani ECM bezpośrednio — całe pośrednictwo idzie przez Kafkę, żeby nie wystawiać wewnętrznych systemów publicznie.

## Komponenty

Każdy mikroserwis ma własny top-level folder w monorepo:

| Katalog | Co to jest | Stack |
|---|---|---|
| [`htmx/`](htmx/README.md) | BFF renderujący formularze schema-driven (form.io), osadzany przez htmx w dowolnym frontendzie | Node.js, TypeScript, Express |
| [`operaton/`](operaton/README.md) | Silnik procesu: triage wniosku kredytowego (credit-score, DMN, routing przez BPMN, human task dla underwritera) | Java 21, Spring Boot, Operaton (BPMN/DMN) |
| [`ecm-adapter/`](ecm-adapter) | Mikroserwis konsumujący zdarzenia dokumentowe z Kafki i przekazujący je do ECM | Go |
| [`admin/`](admin) | Panel admina: zarządzanie schematami formularzy (form.io), page builder (Puck) do składania stron z prawdziwych komponentów platformy, linki do gotowych Cockpit/Tasklist Operatona | React, Refine, Ant Design, Puck |

## Uruchomienie

### Cała platforma naraz (Docker Compose)

```bash
docker compose up -d --build
```

Odpala infrastrukturę (Postgres, WireMock, Kafka, Mailpit) i wszystkie cztery mikroserwisy — `htmx` (:3000), `operaton` (:8080), `ecm-adapter` (:8090), `admin` (:8081).

### Pojedynczy komponent lokalnie

Każdy komponent ma też własne instrukcje w swoim README. W skrócie:

```bash
# widget formularzy
cd htmx
npm install
npm start

# proces BPMN (wymaga docker compose up -d postgres wiremock kafka mailpit z roota)
cd operaton
./mvnw spring-boot:run
```

## Status

MVP, rozwijany iteracyjnie, commit po commicie. Poszczególne README opisują świadomie odłożone ograniczenia (np. brak auth w widgecie, zapis do pliku zamiast bazy).
