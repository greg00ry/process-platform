import path from 'path';
import fs from 'fs/promises';
import express, { Request, Response } from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';

interface FormioComponent {
  key: string;
  label?: string;
  type: string;
  validate?: { required?: boolean };
  [extra: string]: unknown;
}

interface FormSchema {
  components: FormioComponent[];
  [extra: string]: unknown;
}

interface SubmissionEntry {
  engine: 'formio';
  schemaId: string;
  data: Record<string, unknown>;
  submittedAt: string;
  ip: string;
}

interface RequiredField {
  key: string;
  label: string;
}

const app = express();
const PORT = process.env.PORT || 3000;
// Widget ma byc osadzany na dowolnych, nieznanych z gory frontendach - stad otwarty CORS.
const CORS_ORIGIN = process.env.CORS_ORIGIN || '*';
const DATA_FILE = path.join(__dirname, 'data', 'submissions.json');

const submitLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  limit: 10, // max 10 wyslanych formularzy / 10 min / IP
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Zbyt wiele zgloszen z tego adresu. Sprobuj ponownie pozniej.',
});

const FORMIO_FORMS_DIR = path.join(__dirname, 'data', 'forms-formio');
const SCHEMA_ID_PATTERN = /^[a-z0-9-]+$/;

app.use(cors({ origin: CORS_ORIGIN, exposedHeaders: ['X-Total-Count'] }));
app.use(express.json()); // formio wysyla submit jako JSON
app.use(express.static(path.join(__dirname, 'public')));

// Kolejka zapisow, zeby rownolegle requesty nie nadpisywaly sie nawzajem
let writeQueue: Promise<void> = Promise.resolve();

function appendSubmission(entry: SubmissionEntry): Promise<void> {
  writeQueue = writeQueue.then(async () => {
    let submissions: SubmissionEntry[] = [];
    try {
      const raw = await fs.readFile(DATA_FILE, 'utf-8');
      submissions = JSON.parse(raw);
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code !== 'ENOENT') throw err;
    }
    submissions.push(entry);
    await fs.writeFile(DATA_FILE, JSON.stringify(submissions, null, 2), 'utf-8');
  });
  return writeQueue;
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function escapeHtml(str = ''): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// Dynamicznie wstrzykniety <script src> laduje sie asynchronicznie i NIE gwarantuje
// kolejnosci wzgledem kolejnego <script> w tym samym fragmencie (inaczej niz w statycznym
// HTML-u parsowanym od razu) - stad jawne czekanie na load zamiast zakladania kolejnosci.
// Cache w window.__scriptPromises chroni przed powtornym ladowaniem, gdy ten sam widget
// (albo dwa rozne) pojawi sie kilka razy na jednej stronie.
const WIDGET_LOADER_JS = `
window.__loadScriptOnce = window.__loadScriptOnce || function (src) {
  window.__scriptPromises = window.__scriptPromises || {};
  if (!window.__scriptPromises[src]) {
    window.__scriptPromises[src] = new Promise(function (resolve, reject) {
      var s = document.createElement('script');
      s.src = src;
      s.onload = resolve;
      s.onerror = function () { reject(new Error('Nie udalo sie zaladowac ' + src)); };
      document.head.appendChild(s);
    });
  }
  return window.__scriptPromises[src];
};
window.__loadStyleOnce = window.__loadStyleOnce || function (href) {
  if (!document.querySelector('link[href="' + href + '"]')) {
    var l = document.createElement('link');
    l.rel = 'stylesheet';
    l.href = href;
    document.head.appendChild(l);
  }
};
`.trim();

// --- Formularze schema-driven (@formio/js) ---
// Nowy typ dokumentu = nowy plik JSON w data/forms-formio/, zero nowego kodu.

async function loadSchema(dir: string, schemaId: string): Promise<FormSchema | null> {
  if (!SCHEMA_ID_PATTERN.test(schemaId)) return null;
  try {
    const raw = await fs.readFile(path.join(dir, `${schemaId}.json`), 'utf-8');
    return JSON.parse(raw);
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === 'ENOENT') return null;
    throw err;
  }
}

async function saveSchema(dir: string, schemaId: string, schema: FormSchema): Promise<void> {
  if (!SCHEMA_ID_PATTERN.test(schemaId)) throw new Error('Nieprawidlowe ID schematu.');
  await fs.writeFile(path.join(dir, `${schemaId}.json`), JSON.stringify(schema, null, 2), 'utf-8');
}

async function listSchemaIds(dir: string): Promise<string[]> {
  try {
    const files = await fs.readdir(dir);
    return files.filter((f) => f.endsWith('.json')).map((f) => f.slice(0, -5)).sort();
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === 'ENOENT') return [];
    throw err;
  }
}

async function deleteSchema(dir: string, schemaId: string): Promise<void> {
  if (!SCHEMA_ID_PATTERN.test(schemaId)) throw new Error('Nieprawidlowe ID schematu.');
  await fs.unlink(path.join(dir, `${schemaId}.json`));
}

// Wymagane pola wyprowadzone ze schematu - walidacja serwerowa nie jest hardkodowana
// per typ dokumentu, bo nigdy nie ufamy samej walidacji klienckiej formio.
function requiredFieldsFromSchema(schema: FormSchema): RequiredField[] {
  return (schema.components || [])
    .filter((c) => c.type !== 'button' && c.validate && c.validate.required)
    .map((c) => ({ key: c.key, label: c.label || c.key }));
}

function renderFormioWidget(schemaId: string): string {
  const containerId = `formio-container-${schemaId}`;
  const statusId = `formio-status-${schemaId}`;

  return `
<div id="formio-widget-${schemaId}" class="formio-widget">
  <div id="${containerId}"></div>
  <p id="${statusId}"></p>
  <script>
    ${WIDGET_LOADER_JS}
    (function () {
      var schemaId = ${JSON.stringify(schemaId)};
      var container = document.getElementById(${JSON.stringify(containerId)});
      var status = document.getElementById(${JSON.stringify(statusId)});

      window.__loadStyleOnce('/bootstrap.min.css');
      window.__loadStyleOnce('/formio.form.css');

      window.__loadScriptOnce('/formio.form.min.js')
        .then(function () { return fetch('/api/formio-schemas/' + schemaId); })
        .then(function (r) { return r.json(); })
        .then(function (schema) {
          // Formio.createForm zwraca Promise<Form>, nie gotowy obiekt formularza.
          return Formio.createForm(container, schema);
        })
        .then(function (form) {
          form.on('error', function () {
            status.textContent = 'Popraw błędy w formularzu.';
            status.className = 'formio-status error';
          });

          form.on('submit', function (submission) {
            status.textContent = 'Wysyłanie...';
            status.className = 'formio-status';

            fetch('/widget/formio/' + schemaId + '/submit', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(submission.data),
            })
              .then(function (r) { return r.json().then(function (body) { return { ok: r.ok, body: body }; }); })
              .then(function (result) {
                if (result.ok && result.body.ok) {
                  container.innerHTML = '';
                  status.textContent = 'Dziękujemy! Dokument został przyjęty.';
                  status.className = 'formio-status success';
                } else {
                  status.textContent = (result.body.errors && Object.values(result.body.errors).join(' ')) || 'Wystąpił błąd.';
                  status.className = 'formio-status error';
                }
              })
              .catch(function () {
                status.textContent = 'Nie udało się połączyć z serwerem.';
                status.className = 'formio-status error';
              });
          });
        })
        .catch(function (err) {
          console.error('formio: nie udalo sie zaladowac formularza', err);
          container.textContent = 'Nie udało się załadować formularza.';
        });
    })();
  </script>
</div>`.trim();
}

app.get('/api/formio-schemas/:schemaId', async (req: Request<{ schemaId: string }>, res: Response) => {
  const schema = await loadSchema(FORMIO_FORMS_DIR, req.params.schemaId);
  if (!schema) return res.status(404).json({ ok: false, error: 'Nie znaleziono schematu.' });
  res.json(schema);
});

app.get('/widget/formio/:schemaId', async (req: Request<{ schemaId: string }>, res: Response) => {
  const schema = await loadSchema(FORMIO_FORMS_DIR, req.params.schemaId);
  if (!schema) return res.status(404).send('Nie znaleziono formularza.');
  res.send(renderFormioWidget(req.params.schemaId));
});

app.post('/widget/formio/:schemaId/submit', submitLimiter, async (req: Request<{ schemaId: string }>, res: Response) => {
  const schema = await loadSchema(FORMIO_FORMS_DIR, req.params.schemaId);
  if (!schema) return res.status(404).json({ ok: false, error: 'Nie znaleziono formularza.' });

  const data: Record<string, unknown> = req.body || {};
  const errors: Record<string, string> = {};

  for (const field of requiredFieldsFromSchema(schema)) {
    if (!isNonEmptyString(String(data[field.key] ?? ''))) {
      errors[field.key] = `${field.label} jest wymagane.`;
    }
  }

  if (Object.keys(errors).length > 0) {
    return res.status(422).json({ ok: false, errors });
  }

  const entry: SubmissionEntry = {
    engine: 'formio',
    schemaId: req.params.schemaId,
    data,
    submittedAt: new Date().toISOString(),
    ip: req.ip || '',
  };

  try {
    await appendSubmission(entry);
    res.json({ ok: true });
  } catch (err) {
    console.error('Blad zapisu zgloszenia (formio):', err);
    res.status(500).json({ ok: false, errors: { _server: 'Błąd serwera, spróbuj ponownie później.' } });
  }
});

// --- JSON API dla zewnetrznych paneli admina (np. Refine) ---
// Konwencja simple-rest (jak json-server): GET listy z _start/_end + naglowek
// X-Total-Count, GET/PATCH/DELETE pojedynczego zasobu po :id, POST tworzy nowy.
// UWAGA: jak nizej - brak autoryzacji, to PoC (patrz ROADMAP.md).

app.get('/api/admin/forms', async (req: Request, res: Response) => {
  const schemaIds = await listSchemaIds(FORMIO_FORMS_DIR);
  const start = Number(req.query._start ?? 0) || 0;
  const end = Number(req.query._end ?? schemaIds.length) || schemaIds.length;
  const page = schemaIds.slice(start, end);

  const items = await Promise.all(
    page.map(async (id) => {
      const schema = await loadSchema(FORMIO_FORMS_DIR, id);
      return {
        id,
        componentCount: schema?.components?.length ?? 0,
        requiredCount: schema ? requiredFieldsFromSchema(schema).length : 0,
      };
    })
  );

  res.set('X-Total-Count', String(schemaIds.length));
  res.json(items);
});

app.get('/api/admin/forms/:schemaId', async (req: Request<{ schemaId: string }>, res: Response) => {
  const schema = await loadSchema(FORMIO_FORMS_DIR, req.params.schemaId);
  if (!schema) return res.status(404).json({ error: 'Nie znaleziono schematu.' });
  res.json({ id: req.params.schemaId, ...schema });
});

app.post('/api/admin/forms', async (req: Request, res: Response) => {
  const { id, ...schema } = (req.body || {}) as { id?: string } & FormSchema;
  if (!isNonEmptyString(id) || !SCHEMA_ID_PATTERN.test(id)) {
    return res.status(400).json({ error: 'Nieprawidlowe lub brakujace ID (male litery, cyfry, myslniki).' });
  }
  try {
    await saveSchema(FORMIO_FORMS_DIR, id, schema as FormSchema);
    res.status(201).json({ id, ...schema });
  } catch (err) {
    res.status(400).json({ error: (err as Error).message });
  }
});

app.patch('/api/admin/forms/:schemaId', async (req: Request<{ schemaId: string }>, res: Response) => {
  const { id: _ignored, ...schema } = (req.body || {}) as { id?: string } & FormSchema;
  try {
    await saveSchema(FORMIO_FORMS_DIR, req.params.schemaId, schema as FormSchema);
    res.json({ id: req.params.schemaId, ...schema });
  } catch (err) {
    res.status(400).json({ error: (err as Error).message });
  }
});

app.delete('/api/admin/forms/:schemaId', async (req: Request<{ schemaId: string }>, res: Response) => {
  try {
    await deleteSchema(FORMIO_FORMS_DIR, req.params.schemaId);
    res.json({ id: req.params.schemaId });
  } catch (err) {
    res.status(404).json({ error: 'Nie znaleziono schematu.' });
  }
});

// --- Admin: wizualny builder formularzy (Formio.builder) ---
// UWAGA: brak autoryzacji - to PoC. Przed produkcja ta trasa MUSI byc chroniona,
// bo pozwala nadpisywac schematy formularzy uzywane przez publiczne widgety.

function renderBuilderPage(schemaId: string, schema: FormSchema): string {
  return `<!DOCTYPE html>
<html lang="pl">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>Builder formularza: ${escapeHtml(schemaId)}</title>
</head>
<body style="font-family: system-ui, -apple-system, sans-serif; max-width: 900px; margin: 2rem auto; padding: 0 1.5rem;">
  <h1>Builder formularza — ${escapeHtml(schemaId)}</h1>
  <p>Przeciągnij pola z panelu po prawej, żeby ułożyć formularz. Zapis nadpisuje
  <code>data/forms-formio/${escapeHtml(schemaId)}.json</code>.</p>
  <button id="save-btn" style="padding: 0.6rem 1.4rem; font: inherit; cursor: pointer; margin-bottom: 1rem;">
    Zapisz schemat
  </button>
  <span id="save-status" style="margin-left: 1rem; font-weight: 600;"></span>
  <div id="builder-container"></div>

  <script>
    ${WIDGET_LOADER_JS}

    var schemaId = ${JSON.stringify(schemaId)};
    var initialSchema = ${JSON.stringify(schema)};
    var container = document.getElementById('builder-container');
    var saveStatus = document.getElementById('save-status');
    var builderInstance = null;

    // Builder formio uzywa siatki i JS-owego "collapse"/modali Bootstrapa
    // (data-bs-toggle=...) - bez tego panel pol jest w DOM, ale nie wyglada
    // ani nie dziala jak panel (brak kolumn, brak rozwijania sekcji).
    window.__loadStyleOnce('/bootstrap.min.css');
    window.__loadStyleOnce('/bootstrap-icons.min.css');
    window.__loadStyleOnce('/formio.full.css');

    window.__loadScriptOnce('/bootstrap.bundle.min.js')
      .then(function () { return window.__loadScriptOnce('/formio.full.min.js'); })
      .then(function () {
        // Formio.builder zwraca Promise<FormBuilder>, tak jak createForm.
        return Formio.builder(container, initialSchema, {});
      })
      .then(function (builder) {
        builderInstance = builder;
      })
      .catch(function (err) {
        console.error('formio builder: nie udalo sie zaladowac', err);
        container.textContent = 'Nie udało się załadować buildera.';
      });

    document.getElementById('save-btn').addEventListener('click', function () {
      if (!builderInstance) return;
      saveStatus.textContent = 'Zapisywanie...';
      fetch('/admin/forms/' + schemaId, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(builderInstance.schema),
      })
        .then(function (r) { return r.json(); })
        .then(function (body) {
          saveStatus.textContent = body.ok ? 'Zapisano.' : ('Błąd: ' + (body.error || 'nieznany'));
        })
        .catch(function () {
          saveStatus.textContent = 'Nie udało się połączyć z serwerem.';
        });
    });
  </script>
</body>
</html>`;
}

app.get('/admin/forms', async (req: Request, res: Response) => {
  const schemaIds = await listSchemaIds(FORMIO_FORMS_DIR);

  const rows = schemaIds
    .map(
      (id) => `
    <tr>
      <td>${escapeHtml(id)}</td>
      <td><a href="/admin/forms/${encodeURIComponent(id)}/builder" onclick="return openSmall(this.href);">Edytuj</a></td>
      <td><a href="/widget/formio/${encodeURIComponent(id)}" onclick="return openSmall(this.href);">Zobacz formularz</a></td>
    </tr>`
    )
    .join('');

  res.send(`<!DOCTYPE html>
<html lang="pl">
<head>
<meta charset="UTF-8" />
<title>Formularze</title>
<script>
  function openSmall(url) {
    window.open(url, '_blank', 'width=1000,height=750,noopener');
    return false;
  }
</script>
</head>
<body style="font-family: system-ui, -apple-system, sans-serif; max-width: 700px; margin: 2rem auto; padding: 0 1.5rem;">
  <h1>Formularze</h1>

  <table style="width: 100%; border-collapse: collapse;" border="1" cellpadding="8">
    <thead><tr><th>ID</th><th></th><th></th></tr></thead>
    <tbody>${rows || '<tr><td colspan="3">Brak formularzy.</td></tr>'}</tbody>
  </table>

  <h2>Nowy formularz</h2>
  <form onsubmit="event.preventDefault(); var id = document.getElementById('new-id').value.trim(); if (id) openSmall('/admin/forms/' + encodeURIComponent(id) + '/builder');">
    <input id="new-id" type="text" placeholder="np. wniosek-o-urlop" pattern="[a-z0-9-]+" required
      style="padding: 0.5rem; font: inherit;" />
    <button type="submit" style="padding: 0.5rem 1rem; font: inherit; cursor: pointer;">Stwórz</button>
  </form>
  <p><small>ID tylko małe litery, cyfry, myślniki.</small></p>
</body>
</html>`);
});

app.get('/admin/forms/:schemaId/builder', async (req: Request<{ schemaId: string }>, res: Response) => {
  const { schemaId } = req.params;
  if (!SCHEMA_ID_PATTERN.test(schemaId)) return res.status(400).send('Nieprawidlowe ID schematu.');
  const schema = (await loadSchema(FORMIO_FORMS_DIR, schemaId)) || { components: [] };
  res.send(renderBuilderPage(schemaId, schema));
});

app.post('/admin/forms/:schemaId', async (req: Request<{ schemaId: string }>, res: Response) => {
  const { schemaId } = req.params;
  try {
    await saveSchema(FORMIO_FORMS_DIR, schemaId, req.body || {});
    res.json({ ok: true });
  } catch (err) {
    console.error('Blad zapisu schematu:', err);
    res.status(400).json({ ok: false, error: (err as Error).message });
  }
});

app.listen(PORT, () => {
  console.log(`Serwer dziala na http://localhost:${PORT}`);
  console.log(`Widget: GET /widget/formio/:schemaId`);
  console.log(`Admin: GET /admin/forms, GET /admin/forms/:schemaId/builder`);
});
