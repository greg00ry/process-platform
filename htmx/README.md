# Widget formularzu (PoC)

Lekki, samodzielny backend Node.js/TypeScript renderujący formularz **schema-driven** (JSON), który można osadzić w dowolnym frontendzie/CMS przez `hx-get` (htmx) — bez przepisywania go pod każdą platformę z osobna. Formularz jest renderowany po stronie przeglądarki przez [`@formio/js`](https://github.com/formio/formio.js), a backend pełni rolę BFF (Backend For Frontend): serwuje schematy, waliduje zgłoszenia i (docelowo) przekazuje je dalej.

## Architektura

```
przeglądarka (dowolny CMS/frontend)
      │  hx-get "/widget/formio/:schemaId"
      ▼
  Node/Express (ten projekt)  ──►  data/forms-formio/*.json (schematy)
      │  submit
      ▼
  data/submissions.json (na razie plik — docelowo Kafka → Operaton)
```

Docelowa architektura (poza zakresem tego repo, patrz `data/forms/` w historii projektu):
**widget (ten kod)** → **Kafka** (event bus) → **Operaton** (silnik procesowy BPMN) → **ECM**. Ten backend nigdy nie woła Operatona/Kafki/ECM bezpośrednio z przeglądarki — całe pośrednictwo idzie przez serwer, żeby nie wystawiać wewnętrznych systemów publicznie.

## Uruchomienie

```bash
npm install
npm start          # tsx server.ts — bez osobnego kroku budowania
npm run dev         # jw. + auto-restart po zmianach
npm run typecheck   # tsc --noEmit — sprawdzenie typów
```

Domyślnie serwer wstaje na porcie z `PORT` (albo 3000). Domenę dozwoloną przez CORS ustawia się przez `CORS_ORIGIN` (domyślnie `*` — celowo otwarte, bo widget ma być osadzany na nieznanych z góry frontendach).

## Struktura projektu

```
server.ts                    — cały backend (Express + TypeScript)
tsconfig.json
data/forms-formio/*.json     — schematy formularzy (jeden plik = jeden typ dokumentu)
data/submissions.json        — zapisane zgłoszenia (PoC: plik, nie baza danych)
public/
  formio.form.min.js/.css    — zvendorowany renderer @formio/js (MIT)
  formio.full.min.js/.css    — jw. + wbudowany builder (drag & drop)
  bootstrap*, fonts/          — Bootstrap 5 + Bootstrap Icons (wymagane przez builder formio)
  htmx.min.js                 — mechanizm osadzania widgetu (hx-get)
  index.html                  — strona demo
```

## Endpointy

| Metoda | Ścieżka | Co robi |
|---|---|---|
| GET | `/widget/formio/:schemaId` | Fragment HTML do osadzenia (`hx-get` w dowolnym CMS) |
| GET | `/api/formio-schemas/:schemaId` | Surowy schemat JSON (pobierany przez widget w przeglądarce) |
| POST | `/widget/formio/:schemaId/submit` | Przyjmuje zgłoszenie, waliduje pola wymagane wyprowadzone ze schematu, zapisuje |
| GET | `/admin/forms` | Lista wszystkich formularzy + tworzenie nowych |
| GET | `/admin/forms/:schemaId/builder` | Wizualny builder (drag & drop, `Formio.builder()`) |
| POST | `/admin/forms/:schemaId` | Zapis schematu z buildera |

## Dodawanie nowego typu dokumentu

Bez dotykania kodu: `http://localhost:3000/admin/forms` → wpisz ID → zaprojektuj formularz w builderze → "Zapisz schemat". Tworzy to nowy plik w `data/forms-formio/`, natychmiast dostępny pod `/widget/formio/<id>`.

## Znane ograniczenia PoC (świadomie odłożone)

- **Brak autoryzacji** na `/admin/forms*` — każdy znający URL może nadpisać schemat formularza. Docelowo role/logowanie mają przyjść z integracji z ECM, nie z własnej implementacji auth.
- **Zapis do pliku, nie do bazy** — wystarcza na PoC
- **Upload plików nieaktywny** — schemat formularza może mieć pole typu `File`, ale backend nie ma jeszcze skonfigurowanego storage providera (rekomendacja: provider `url` + self-hosted MinIO, patrz historia projektu).
- **Rate limiting** ustawiony na 10 zgłoszeń / 10 min / IP — dostrojone pod PoC, do przeliczenia pod realny ruch.

## Licencje

Wszystkie zależności w projekcie są permisywne: `@formio/js`, Express, Bootstrap, htmx.org — MIT/0BSD. Świadomie **nie** używamy pełnego serwera Form.io (`github.com/formio/formio`) ani biblioteki `form-js` (bpmn.io) — pierwszy ze względu na licencję OSL-3.0 (copyleft) i wymóg MongoDB, druga ze względu na obowiązkowy, niemożliwy do usunięcia watermark "powered by bpmn.io".
