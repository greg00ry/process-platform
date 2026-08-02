# admin (panel Refine)

React + [Refine](https://refine.dev) + Ant Design, scaffoldowane przez `create-refine-app` (nie od zera). Dwa resource'y: `admin/forms` (CRUD schematów) i `admin/pages` (Puck page builder, patrz niżej) — nazwa resource'u = ścieżka API w htmx.

## Gotcha: `useOne` zwraca rekord bezposrednio w `result`, nie `result.data`

`@refinedev/core`'s `useOne` w tej wersji: `const { result, query } = useOne(...)` — `result` TO JUZ rekord (`TData | undefined`), nie `{ data: T }`. Uzycie `result?.data` cicho zwraca `undefined` (bez bledu typu!) i wygląda jak "nie znaleziono", mimo ze fetch sie udal (200 OK) — złapane w `pages/editor.tsx`/`pages/render.tsx`. Antd's `useForm` (wyzszy poziom, uzywany w `forms/*`) opakowuje to poprawnie, wiec tam tego nie zobaczysz.

## Gotcha: publiczne trasy (`/p/:id`) dziedzicza dark theme panelu

`<Puck>` (edytor) renderuje canvas w iframe, wiec jest odizolowany od stylow hosta. `<Render>` (publiczny podglad) — nie, renderuje wprost do DOM panelu, wiec dziedziczy ciemny motyw (biały tekst na białym tle bez fixu). `pages/render.tsx` resetuje `background`/`color` recznie na poziomie wrappera — dodatkowo kazdy komponent w `puck/config.tsx` ma teraz **wlasny** jawny `color` (nie polega tylko na dziedziczeniu), zeby byl samowystarczalny niezaleznie od tego gdzie `<Render>` zostanie kiedys uzyty (np. inny podglad, eksport). Dodajac nowy komponent z tekstem — ustaw mu kolor jawnie, nie zakladaj kontekstu.

## Data provider = konwencja simple-rest

`src/providers/data.ts` używa `createSimpleRestDataProvider` z `@refinedev/rest` — konwencja jak json-server: `GET ?_start=&_end=` + nagłówek `X-Total-Count` (list), `GET /:id` (one), `POST` (create), `PATCH /:id` (update), `DELETE /:id`. Gada z `htmx`'s `/api/admin/forms*` (patrz `htmx/CLAUDE.md`) — **nie** z `/api/formio-schemas/*` (to osobne, dla widgetu, inny kształt odpowiedzi).

## Gotcha: `VITE_*` = build-time, musi być browser-reachable

Patrz root `CLAUDE.md`. Krótko: `admin/.env` i `admin/Dockerfile` (`ARG`/`ENV VITE_API_URL` itd.) muszą wskazywać na `localhost:<port-hosta>`, nie na nazwy serwisów compose — SPA działa w przeglądarce użytkownika, nie w sieci dockerowej.

## Edycja schematu formularza = link do htmx, nie własny builder

`src/pages/forms/{list,edit}.tsx` linkują (nowa karta) do `${WIDGET_BASE_URL}/admin/forms/:id/builder` — istniejącego, wizualnego (drag&drop) buildera form.io hostowanego przez `htmx`. Świadoma decyzja: nie duplikować drag&drop UI w Refine. Textarea z surowym JSON w `Create`/`Edit` (`components` field, `getValueProps`/`normalize` trick żeby array↔string się zgadzały) to fallback dla szybkich edycji, nie ma zastępować buildera.

## Page builder (Puck) = kompozycja prawdziwych komponentow, nie generyczny website builder

`src/puck/config.tsx` — MIT, React-native (nie GrapesJS/generyczny HTML). Standardowy zestaw blokow (Heading/Text/Image/Button/Section/Columns/Spacer/Card) + `FormWidget`, ktory embeduje **prawdziwy** widget htmxa przez iframe (`WIDGET_BASE_URL/widget/formio/:schemaId`) — celowo, zeby builder skladal realne ekrany aplikacji, nie mockupy. Dane strony = JSON (`content`/`root`), zapisywane przez `admin/pages` do `htmx`'s `data/pages/`. Edytor (`/pages/edit/:id`) i publiczny render (`/p/:id`) siedza POZA `ThemedLayout` w `App.tsx` — potrzebuja pelnego ekranu / to widok end-usera, nie panelu.

## Cockpit/Tasklist — tylko linki

`src/components/header/index.tsx` linkuje (nowa karta, `OPERATON_BASE_URL`) do gotowych webappek Operatona. Nie buduj tu własnego widoku procesów/zadań — Operaton już to ma (patrz `operaton/CLAUDE.md`).

## Brak auth

Scaffold wybrany bez auth providera (`Do you need any Authentication logic?: None`). Świadomy brak, patrz root `ROADMAP.md`.
