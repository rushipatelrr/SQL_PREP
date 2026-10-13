# SQL PREP → MERN migration — backend core + full 50-level curriculum

The Express/TypeScript/MongoDB **backend core** (auth, data models, server-authoritative
progression engine), now with the **complete 50-level curriculum** — every section from the
expansion brief, Introduction through the real-world capstones. The React client is next.

**Important — read this first:** this code was written by hand in a sandboxed environment
with no network access, so it has **not** been through a real `npm install && npm run
build && npm test` cycle yet. What I *could* do without network: Node ships a built-in
SQLite module (`node:sqlite`), so `scripts/verify-curriculum.ts` actually **executes every
one of the 203 exercises' reference SQL** — including running each mutation exercise's
statement and then its grading query — against the real seeded data, not just a syntax
check. All 203 pass. I also ran a structural integrity pass (no duplicate ids, no order
gaps, every referenced dataset exists, every mutation exercise has its required fields,
every exercise has hints) and a best-effort TypeScript check (stub types, since real
`@types/*` packages need network to install) that found no new errors. What's still
unverified is anything needing an actual installed package — `sql.js` in the real sandbox
worker, MongoDB, Passport, Jest itself. Please run the steps below and send me any errors.

## What's here

```
sql-prep-mern/
  README.md
  server/
    src/
      config/            env, MongoDB connection, Passport (Google OAuth) setup
      models/             User, Level, Exercise (kind/datasetKey/etc.), Progress
      services/
        sql-sandbox/
          datasets/        registry.ts + one file per dataset (see below)
          query-guard.ts    parameterized per-statement-kind safety guard
          result-matcher.ts, sandbox.worker.ts, sandbox.service.ts
        progress.service.ts, submission.service.ts, user.service.ts, scoring.ts
      controllers/, routes/, middleware/, validators/
      data/
        curriculum.ts        all 50 levels' original exercises (BASE_CURRICULUM)
        extra-exercises.ts   extra practice appended per level — see below
    scripts/
      seed.ts                  idempotent: populates MongoDB from data/curriculum.ts
      verify-curriculum.ts     dev tool — runs every exercise's SQL for real
    tests/                 Jest — pure-logic unit tests + route-level integration tests
```

## The four datasets

| Dataset | Tables | Used for |
|---|---|---|
| `students` | `students` | Levels 1–9 — the original prototype's data, untouched |
| `employees` | `employees`, `departments` | Levels 10–23, 40–47 — org chart with a self-referencing `manager_id`, nullable `bonus`, and a `department_id` foreign key |
| `shop` | `customers`, `products`, `orders`, `order_items`, `audit_log` | Levels 24–48 — subqueries, set operations, mutations, DDL, e-commerce capstone |
| `bank` | `accounts`, `transactions` | Level 50 — the banking capstone (computed balances, running totals) |

A dataset can have multiple tables (for joins), and an exercise can combine **two different
datasets** in one sandbox via `extraDatasetKeys` (used by the Set Operations section, e.g.
comparing `students.city` against `shop.customers.city`). Adding a new dataset is one file
under `sql-sandbox/datasets/` plus one line in `registry.ts`.

`npm run verify-curriculum` re-runs every exercise's SQL for real and flags anything that
errors or returns a suspicious empty result. **Run this after any edit to `curriculum.ts` or
`extra-exercises.ts`.**

## Extending the curriculum without breaking anyone's progress

An exercise's id is derived from its position (`level-3-ex-2`), and a learner's saved
progress (`completedExercises`, `currentExerciseId`) references those ids directly. That
makes **reordering or inserting into the middle of a level's exercise list a breaking
change** — it would silently relabel exercises out from under anyone mid-course.

So: new practice exercises go in `extra-exercises.ts`, keyed by `levelId`, and
`curriculum.ts` appends them after that level's original list (see the `EXTRA_EXERCISES` /
`CURRICULUM` wiring at the bottom of `curriculum.ts`). They're always the last, hardest
exercises in their level, and existing ids never shift. This is how every level here already
has at least 4 exercises — some levels needed 1–3 more, added this way, verified the same as
everything else.

## Mutation-kind exercises (INSERT/UPDATE/DELETE/CREATE/ALTER/DROP/VIEW/INDEX)

The original sandbox only ever allowed a single `SELECT`/`WITH` statement — fine for a
read-only exercise, useless for teaching INSERT or CREATE TABLE. Rather than weaken the
guard, exercises now declare a `kind`:

- **`'query'`** (the default, ~164 exercises): unchanged from before — the learner's SELECT
  is graded directly against the reference SELECT's result.
- **`'mutation'`** (39 exercises, levels 34–42 and 45): the learner's statement must match
  one declared `allowedStatement` (`'insert'`, `'create_table'`, etc. — enforced by the same
  guard, just parameterized instead of hardcoded to SELECT). It runs against a fresh sandbox
  for its *effect*, then an author-written, never-learner-supplied `verifyQuery` (always a
  SELECT) inspects the resulting state — table existence via `sqlite_master`, column
  structure via `pragma_table_info()`, or just the affected rows. The learner's and the
  reference's statements each go through this same run-then-verify flow, and their
  `verifyQuery` results are what's actually compared.

Every DELETE/UPDATE `verifyQuery` in the curriculum also checks an **unrelated control
row or total count** — not just the target — specifically to catch a learner who forgot a
WHERE clause and mutated the whole table. I verified this by hand: an UPDATE/DELETE with no
WHERE produces a different (and correctly failing) result against every one of these checks.

`ALWAYS_FORBIDDEN` in `query-guard.ts` still blocks `ATTACH`, `PRAGMA`-as-a-statement,
`VACUUM`, and transaction control regardless of `kind` — those have no legitimate place in a
single-statement, freshly-seeded, throwaway-per-request sandbox.

## Setup

1. **MongoDB** — locally or MongoDB Atlas' free tier.
2. **Google OAuth credentials** — [Google Cloud Console](https://console.cloud.google.com/apis/credentials),
   OAuth Client ID (Web application), redirect URI `http://localhost:5000/api/auth/google/callback`.
3. Copy `server/.env.example` to `server/.env` and fill in `MONGODB_URI`, `GOOGLE_CLIENT_ID`,
   `GOOGLE_CLIENT_SECRET`, `SESSION_SECRET` (the file has a one-liner to generate one).
4. ```bash
   cd server
   npm install
   npm run verify-curriculum   # sanity-check all 203 exercises before seeding (instant, no DB needed)
   npm run seed                # populate MongoDB from data/curriculum.ts
   npm run dev                 # http://localhost:5000
   ```
5. `npm test`, `npm run typecheck`, `npm run lint`, `npm run build` to confirm everything
   the sandbox here couldn't check for itself.

`GET /api/auth/google` in a browser exercises the real OAuth flow once `.env` is filled in.
`GET /health` confirms the server is up.

## API surface

```
GET  /api/auth/google | google/callback | me      POST /api/auth/logout

GET  /api/levels                   all levels + your computed state (completed/current/locked)
GET  /api/levels/:levelId          theory + (if completed) exercise list for review

GET  /api/exercises/:exerciseId              prompt/hints-count/schema/kind — never the answer
POST /api/exercises/:exerciseId/submit       { sql, mode: "course"|"practice" }
POST /api/exercises/:exerciseId/hint         { mode }
POST /api/exercises/:exerciseId/reveal-solution   { mode }

GET  /api/progress/me              the authoritative resume state
POST /api/practice/:levelId/start  begin a Practice Again run for a completed level
```

## What's next

The React/TypeScript/Vite client — Monaco editor, TanStack Query hooks against this API,
Tailwind + shadcn/ui, matching the original's dark/near-black theme. Say the word.


## How the original prototype maps to this

| Original (`sql-prep.html`) | Here |
|---|---|
| `LEVELS` array, hardcoded in the page | `data/curriculum.ts` → seeded into `Level`/`Exercise` collections |
| `progress` object saved via `window.storage` | `Progress` document in MongoDB, one per authenticated user, fetched via `GET /api/progress/me` |
| `attempts`/`hintsUsed`/`locked` (page-local JS variables) | `Progress.activeAttempt`, tracked server-side — see "One deliberate change" below |
| `runSQLRaw()` using `sql.js` in the browser | `sql-sandbox/` — the same `sql.js` engine, moved server-side into a worker thread, seeded with the exact same deterministic `students` table |
| `resultsMatch()` / `normalizeRows()` | `sql-sandbox/result-matcher.ts` — ported line-for-line |
| Practice Again / Review Theory / Review List (client-side view state) | Same behavior, now backed by `Progress.practiceSession` + server-enforced access rules; see `progress.service.ts` |
| No accounts — one browser, one prototype session | Google OAuth → one `User` + one `Progress` document, restorable on any device |

## One deliberate behavior change (flagged, not hidden)

In the original, `attempts` and `hintsUsed` were plain in-memory variables that reset to
zero on every page render — including a plain browser refresh mid-exercise. That's harmless
in a single-player prototype, but the spec explicitly calls for the server to be the
authority over XP (no trusting a client-supplied `{completed:true, xp:10000}`). If refreshing
reset the attempt counter, a learner could refresh right before submitting to keep re-rolling
"first try" XP.

So here, the attempt/hint counters live on `Progress.activeAttempt` and only reset when the
learner *moves to a different exercise* — not on every request. The visible behavior (get a
hint, see feedback, try again) is identical; only this one refresh-based loophole is closed.
Happy to change this if you'd rather match the original exactly.

## The SQL sandbox

Each submission spawns a fresh Node `worker_thread` with its own brand-new, in-memory
`sql.js` database — seeded only with the `students` table, nothing else. It never sees
MongoDB, your app's collections, or any secret. A static guard rejects anything that isn't a
single `SELECT`/`WITH` statement before it even reaches the worker, and a hard timeout
terminates the worker if a query somehow still runs too long. Every exercise's *reference*
SQL and the learner's SQL run through the exact same sandbox, and their results are compared
— never a string comparison against the reference query text, matching the original.

## Setup

1. **MongoDB** — either run one locally or use MongoDB Atlas' free tier. Copy the
   connection string.
2. **Google OAuth credentials** — in the
   [Google Cloud Console](https://console.cloud.google.com/apis/credentials), create an
   OAuth Client ID (type: Web application). Add
   `http://localhost:5000/api/auth/google/callback` as an authorized redirect URI for local
   dev.
3. Copy `server/.env.example` to `server/.env` and fill in `MONGODB_URI`,
   `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, and a random `SESSION_SECRET` (the file has a
   one-liner to generate one).
4. ```bash
   cd server
   npm install
   npm run seed     # populates Levels/Exercises from data/curriculum.ts
   npm run dev       # starts the API on http://localhost:5000
   ```
5. In another terminal: `npm test` (unit tests run instantly; the integration tests use
   `mongodb-memory-server`, which downloads a small MongoDB binary the first time — that
   needs network access once). Then `npm run typecheck`, `npm run lint`, and `npm run build`
   to confirm a clean production build.

There's no frontend yet, so `GET /api/auth/google` in a browser is the quickest way to
exercise the real OAuth flow end-to-end once your `.env` is filled in — it'll redirect back
to `CLIENT_URL` (default `http://localhost:5173`) once signed in, which will 404 until the
client exists. `GET /health` confirms the server itself is up.

## API surface built so far

```
GET  /api/auth/google              start Google sign-in
GET  /api/auth/google/callback     OAuth redirect target
GET  /api/auth/me                  current signed-in user
POST /api/auth/logout              end session only — never touches progress

GET  /api/levels                   all levels + your computed state (completed/current/locked)
GET  /api/levels/:levelId          theory + (if completed) exercise list for review

GET  /api/exercises/:exerciseId              prompt/hints-count/schema — never the answer
POST /api/exercises/:exerciseId/submit       { sql, mode: "course"|"practice" }
POST /api/exercises/:exerciseId/hint         { mode }
POST /api/exercises/:exerciseId/reveal-solution   { mode } — added beyond the spec's
                                                    suggested list, to preserve the
                                                    original's "Show Solution" button

GET  /api/progress/me              the authoritative resume state
POST /api/practice/:levelId/start  begin a Practice Again run for a completed level
```

## What's next

The React/TypeScript/Vite client — Monaco editor, TanStack Query hooks against this API,
Tailwind + shadcn/ui, matching the original's dark/near-black theme and layout. Say the word
whenever you're ready for that slice.
