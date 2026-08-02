---
name: sync-claude-md
description: Audits every CLAUDE.md in this repo (root + per-module) against the actual current codebase state and fixes whatever has drifted. Use after structural changes (renamed/moved folders, changed ports or env vars, added/removed endpoints, new modules), or periodically to catch silent drift. Invoke as /sync-claude-md.
---

# Sync CLAUDE.md with reality

This repo has one root `CLAUDE.md` plus one per module (`htmx/CLAUDE.md`, `operaton/CLAUDE.md`, `ecm-adapter/CLAUDE.md`, `admin/CLAUDE.md`, and any added later). They exist to save future-you from re-deriving non-obvious facts and gotchas — but they only help if they're accurate. This skill's job is to catch drift and fix it, not just report it.

## Procedure

1. **Find every CLAUDE.md.** `find . -name CLAUDE.md -not -path "*/node_modules/*" -not -path "*/.git/*"`. Read each one fully.

2. **Extract concrete, checkable claims from each file.** Anything specific enough to verify: file/directory paths, port numbers, endpoint routes and HTTP methods, env var names and where they're consumed, npm/mvn/go commands, framework/dependency names, cross-module references (e.g. "admin talks to htmx's /api/admin/forms").

3. **Verify each claim against the actual repo state** — don't trust the file, check the source:
   - Paths → confirm they exist (`ls`/`Read`/`Glob`).
   - Ports/env vars → cross-check `docker-compose.yml` and the module's own config (`application.yaml`, `main.go`, `.env`, `package.json` scripts, `Dockerfile` ARG/ENV).
   - Endpoints/routes → grep the actual source (`server.ts`, `*Controller.java`, `server.go`) for the route still existing as described, same method, same path.
   - Commands → confirm they still exist (`package.json` scripts, `pom.xml`/`build.gradle.kts` targets, `Makefile`, etc.).
   - Cross-module claims → verify from both sides (if `htmx/CLAUDE.md` says admin consumes `/api/admin/forms`, confirm `admin/src/providers` actually points there).

4. **Fix drift directly with Edit** — this skill changes files, it doesn't just report:
   - Stale fact (renamed path, changed port, moved endpoint) → correct it in place, keep the surrounding sentence/style.
   - Described thing no longer exists at all → remove that bullet/section rather than leaving a dangling reference.
   - Genuinely new, non-obvious, load-bearing fact with no CLAUDE.md coverage yet (new gotcha, new module with no CLAUDE.md at all) → add a concise note. Do not turn this into exhaustive documentation — only things worth knowing *before* touching the code, not things obvious from reading it.
   - A new module folder with no `CLAUDE.md` at all → create one following the existing modules' structure/tone (short, gotcha-focused, not a README rehash), and add it to the table in the root `CLAUDE.md`.

5. **Leave alone what's still accurate.** Don't rewrite tone, restructure, or "improve" sections that are correct — this is a drift-correction pass, not a rewrite.

6. **Don't touch `ROADMAP.md`** unless a CLAUDE.md's reference to it is stale (e.g. it claims something is on the roadmap that's since been built) — that file has its own purpose and owner (the user updates it as work progresses).

7. **Report a short summary**: which files were checked, what was fixed (with a one-line reason each), and what was already accurate. If nothing had drifted, say so plainly instead of inventing changes to justify the run.
