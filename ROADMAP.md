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

## Status

`admin` (Refine) gotowy: CRUD na schematach formularzy + linki do Cockpit/Tasklist. Punkty powyżej wciąż otwarte — to następny przystanek.
