# admin (panel Refine)

React + [Refine](https://refine.dev) + Ant Design, scaffoldowane przez `create-refine-app` (nie od zera). Jeden resource na razie: `admin/forms` (nazwa resource'u = ścieżka API w htmx, patrz niżej).

## Data provider = konwencja simple-rest

`src/providers/data.ts` używa `createSimpleRestDataProvider` z `@refinedev/rest` — konwencja jak json-server: `GET ?_start=&_end=` + nagłówek `X-Total-Count` (list), `GET /:id` (one), `POST` (create), `PATCH /:id` (update), `DELETE /:id`. Gada z `htmx`'s `/api/admin/forms*` (patrz `htmx/CLAUDE.md`) — **nie** z `/api/formio-schemas/*` (to osobne, dla widgetu, inny kształt odpowiedzi).

## Gotcha: `VITE_*` = build-time, musi być browser-reachable

Patrz root `CLAUDE.md`. Krótko: `admin/.env` i `admin/Dockerfile` (`ARG`/`ENV VITE_API_URL` itd.) muszą wskazywać na `localhost:<port-hosta>`, nie na nazwy serwisów compose — SPA działa w przeglądarce użytkownika, nie w sieci dockerowej.

## Edycja schematu formularza = link do htmx, nie własny builder

`src/pages/forms/{list,edit}.tsx` linkują (nowa karta) do `${WIDGET_BASE_URL}/admin/forms/:id/builder` — istniejącego, wizualnego (drag&drop) buildera form.io hostowanego przez `htmx`. Świadoma decyzja: nie duplikować drag&drop UI w Refine. Textarea z surowym JSON w `Create`/`Edit` (`components` field, `getValueProps`/`normalize` trick żeby array↔string się zgadzały) to fallback dla szybkich edycji, nie ma zastępować buildera.

## Cockpit/Tasklist — tylko linki

`src/components/header/index.tsx` linkuje (nowa karta, `OPERATON_BASE_URL`) do gotowych webappek Operatona. Nie buduj tu własnego widoku procesów/zadań — Operaton już to ma (patrz `operaton/CLAUDE.md`).

## Brak auth

Scaffold wybrany bez auth providera (`Do you need any Authentication logic?: None`). Świadomy brak, patrz root `ROADMAP.md`.
