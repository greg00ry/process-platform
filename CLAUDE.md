# process-platform

Monorepo, jeden root `git` (historie poszczególnych serwisów sprzed 2026-08-01 zostały zrzucone przy scaleniu — nie próbuj ich odtwarzać). Cztery niezależne stacki, każdy w swoim top-level folderze, każdy z własnym `CLAUDE.md`:

| Folder | Co to jest | CLAUDE.md |
|---|---|---|
| `htmx/` | Node/Express BFF, widget formularzy (form.io) | [htmx/CLAUDE.md](htmx/CLAUDE.md) |
| `operaton/` | Spring Boot + Operaton (silnik BPMN/DMN) | [operaton/CLAUDE.md](operaton/CLAUDE.md) |
| `ecm-adapter/` | Go, konsument Kafki, proxy do ECM | [ecm-adapter/CLAUDE.md](ecm-adapter/CLAUDE.md) |
| `admin/` | React + Refine, panel admina | [admin/CLAUDE.md](admin/CLAUDE.md) |

Przed zmianami w konkretnym module przeczytaj też jego `CLAUDE.md` — tu tylko rzeczy przekrojowe.

## Uruchomienie całości

`docker-compose.yml` jest w roocie (nie w `operaton/`, mimo że historycznie tam był). `docker compose up -d --build` odpala wszystkie 8 kontenerów: postgres, kafka, wiremock, mailpit, htmx (:3000), operaton (:8080), ecm-adapter (:8090), admin (:8081).

## Gotcha: browser-side vs server-side env vars

`operaton` i `ecm-adapter` czytają env vary w runtimie i mogą wskazywać na inne kontenery po nazwie (`kafka:9092`, `postgres:5432`) — normalne w sieci compose.

`admin` to SPA (Vite/React) — jego `VITE_*` zmienne są wpiekane w bundle **przy buildzie obrazu**, a kod wykonuje się w przeglądarce użytkownika, poza siecią compose. Dlatego `VITE_API_URL`/`VITE_WIDGET_BASE_URL`/`VITE_OPERATON_BASE_URL` muszą wskazywać na `localhost:<zmapowany-port-hosta>`, nigdy na nazwę serwisu (`htmx:3000` się nie rozwiąże w przeglądarce). Patrz `admin/Dockerfile` (`ARG`/`ENV VITE_*`) i wpis `admin` w `docker-compose.yml`.

## Znane, świadome braki

`ROADMAP.md` w roocie śledzi rzeczy celowo odłożone (auth, observability, CI/CD, testy poza `operaton`, odporność Kafki na duplikaty/błędy). Nie traktuj ich braku jako przeoczenia i nie dodawaj auth/testów/etc. spekulacyjnie bez pytania — to osobny, świadomy etap pracy.

## Konwencja portów (host)

| Serwis | Port |
|---|---|
| htmx | 3000 |
| operaton | 8080 |
| ecm-adapter | 8090 |
| admin | 8081 (dev: 5173) |
| postgres | 5432 |
| kafka | 9092 |
| wiremock | 8089 |
| mailpit | 1025 (SMTP), 8025 (UI) |
