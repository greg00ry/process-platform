# Roadmap do dojrzałości platformy

Checklista rzeczy, które faktycznie odróżniają projekt "senior" od demo z ładnym stackiem. Nie chodzi o kolejne mikroserwisy, tylko o domknięcie tego, co już jest.

## Security

- [ ] Auth na `htmx` `/admin/forms*` — obecnie każdy znający URL może nadpisać schemat formularza
- [ ] Auth między serwisami (`operaton` ↔ `ecm-adapter`) — dziś otwarte HTTP bez żadnej weryfikacji
- [ ] Sekrety poza plikami configów (`application.yaml` ma hasła Postgresa/Operatona wprost) — env vars / secret store
- [ ] Rate limiting / walidacja wejścia na `ecm-adapter` (na razie tylko na `htmx`)

## Observability

- [ ] Structured logging spięte między serwisami (correlation/trace ID przechodzące przez Kafkę)
- [ ] Metryki (np. Micrometer + Prometheus dla `operaton`, coś analogicznego dla `ecm-adapter`)
- [ ] Tracing rozproszony (OpenTelemetry) — przynajmniej przez granicę Kafki i wywołania HTTP

## CI/CD

- [ ] Pipeline (GitHub Actions) uruchamiający build + testy dla każdego serwisu przy PR
- [ ] Build i publikacja obrazów Docker per serwis
- [ ] Lint/typecheck jako gate (`tsc --noEmit` dla htmx/admin, `go vet`, itd.)

## Testy

- [ ] Testy dla `htmx` (obecnie zero — tylko `operaton` ma `LoanApplicationIT`)
- [ ] Testy dla `ecm-adapter` (obecnie zero)
- [ ] Testy dla `admin` (Refine)

## Odporność Kafki

- [ ] Idempotencja konsumenta w `ecm-adapter` (dziś powtórzone zdarzenie = powtórzone przetworzenie)
- [ ] Retry z backoff zamiast prostego `sleep` po błędzie odczytu
- [ ] Dead-letter queue dla zdarzeń, których nie da się sparsować/przetworzyć

## Dokumentacja architektury

- [ ] Automatyczna dokumentacja C4 (Context/Container, ewentualnie Component dla `operaton`) zamiast ręcznego diagramu ASCII w README. Kandydaci:
  - **[Structurizr Lite](https://structurizr.com/help/lite)** — oficjalne narzędzie od twórcy C4, self-hosted (Docker), architektura jako kod (DSL), generuje Context/Container/Component/Deployment z jednego źródła. Najbliższe temu jak już pracujemy (docker-compose, CLAUDE.md jako "architecture as code").
  - **[LikeC4](https://likec4.dev)** — nowszy, open-source, dobry DX (VS Code, live preview), eksport do statycznej strony/CI.
  - **Mermaid C4** (`C4Context`/`C4Container`) — najlżejsze, renderuje się natywnie w GitHub markdown, ale mniej możliwości niż DSL-owe narzędzia.
  - Kierunek: prawdopodobnie Structurizr Lite lub LikeC4, żeby diagram żył jako kod w repo i aktualizował się razem z architekturą, nie ręcznie w README.

## Status

`admin` (Refine) gotowy: CRUD na schematach formularzy + linki do Cockpit/Tasklist. Punkty powyżej wciąż otwarte — to następny przystanek.
