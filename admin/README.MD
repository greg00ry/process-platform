# admin (panel Refine)

Wewnętrzny panel do zarządzania platformą — React + [Refine](https://refine.dev) + Ant Design. To nie jest CMS ani narzędzie dla end-usera; strony, które end user faktycznie widzi, są publikowane pod `/p/:id` (patrz "Strony" niżej), same w sobie bez chrome'u panelu.

## Zasoby

| Zasób | Ścieżka | Co robi |
|---|---|---|
| Formularze | `/forms` | CRUD schematów form.io. Gada z JSON API `htmx` (`/api/admin/forms*`). Edycja pól przez surowy JSON lub link do wizualnego (drag&drop) buildera hostowanego przez `htmx`. |
| Strony | `/pages` | Page builder ([Puck](https://puckeditor.com), MIT) do składania ekranów z gotowych komponentów (Heading, Text, Image, Button, Section, Columns, Spacer, Card) + `FormWidget`, który osadza **prawdziwy** widget formularza z `htmx`. Edytor pod `/pages/edit/:id`, publiczny (bez chrome'u panelu) podgląd pod `/p/:id`. |

Header linkuje też (nowa karta) do gotowych webappek Operatona — Cockpit i Tasklist — zamiast je odtwarzać.

## Uruchomienie

```bash
npm install
npm run dev      # vite dev server, domyślnie :5173
npm run build    # tsc + vite build
```

### Zmienne środowiskowe

`.env` (lokalnie) / `ARG`+`ENV` w `Dockerfile` (kontener):

| Zmienna | Domyślnie | Do czego |
|---|---|---|
| `VITE_API_URL` | `http://localhost:3000/api` | Data provider (`htmx`'s `/api/admin/*`) |
| `VITE_WIDGET_BASE_URL` | `http://localhost:3000` | Link do widgetu/buildera formularzy, iframe `FormWidget` w Pucku |
| `VITE_OPERATON_BASE_URL` | `http://localhost:8080` | Linki do Cockpit/Tasklist |

**Ważne:** to Vite/SPA — te zmienne są wpiekane w bundle przy buildzie i muszą wskazywać na adresy dostępne z przeglądarki użytkownika (`localhost:<port-hosta>`), nie na nazwy serwisów w sieci Docker Compose. Szczegóły w [`CLAUDE.md`](CLAUDE.md).

## Znane ograniczenia

Brak autoryzacji — scaffold świadomie bez auth providera. Śledzone w root [`ROADMAP.md`](../ROADMAP.md).

## Stack

React 19, TypeScript, Vite, Refine (core + antd + react-router + rest data provider), Ant Design, Puck.
