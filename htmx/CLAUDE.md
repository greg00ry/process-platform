# htmx (form widget BFF)

Node.js/TypeScript/Express, uruchamiane przez `tsx` — brak kroku builda w dev (`npm start` = `tsx server.ts`). Cały backend to jeden plik: `server.ts`.

## Przechowywanie danych

Pliki, nie baza: `data/forms-formio/*.json` (schematy), `data/submissions.json` (zgłoszenia). To świadome uproszczenie PoC (patrz root `ROADMAP.md`), nie próbuj tego "naprawiać" migracją do bazy bez pytania.

## Dwie równoległe powierzchnie admina — trzymaj je w spójności

- `/admin/forms*` — strony HTML z wizualnym builderem (`Formio.builder()`), zapis przez `POST /admin/forms/:schemaId`. Używane bezpośrednio przez ludzi.
- `/api/admin/forms*` — czysty JSON API w konwencji simple-rest (jak json-server: `_start`/`_end` + `X-Total-Count`, `PATCH` do update) — to konsumuje panel `admin/` (Refine). Patrz `admin/CLAUDE.md`.

Obie ścieżki operują na tych samych plikach (`loadSchema`/`saveSchema`/`listSchemaIds` w `server.ts`). Zmieniając format zapisu schematu, zaktualizuj oba miejsca.

## Brak autoryzacji — celowo, na razie

`/admin/forms*` i `/api/admin/forms*` nie mają auth. To świadomy, śledzony w `ROADMAP.md` brak — każdy znający URL może nadpisać/skasować schemat. Nie dodawaj auth tutaj bez wyraźnej prośby.

## CORS

Celowo szeroko otwarty (`CORS_ORIGIN` domyślnie `*`) — widget ma być osadzalny na nieznanych z góry frontendach. `exposedHeaders: ['X-Total-Count']` jest wymagane, żeby przeglądarka (data provider Refine) w ogóle widziała ten nagłówek.
