# JobChecker

JobChecker turns mixed chat exports and job-link lists into a ranked, searchable job pipeline. It extracts and normalizes public URLs, scrapes each listing with a layered fetch/JSON-LD/provider/HTML/Playwright strategy, detects technical stacks and job requirements, scores the listing against editable preferences, and saves the result in MongoDB.

## Features

- Robust URL extraction from timestamps, names, punctuation, and adjacent links
- URL normalization, tracking-parameter removal, validation, and deduplication
- SSRF defenses for local/private addresses, DNS resolutions, redirects, and browser requests
- Native-fetch scraping with JSON-LD, nine provider adapters, generic HTML parsing, and Playwright fallback
- Shared Playwright browser and bounded batch concurrency
- Context-aware technology detection with aliases, evidence, and required/preferred/nice-to-have classification
- Match scoring, experience/seniority, remote status, authorization, sponsorship, location, salary, and employment detection
- MongoDB persistence with unique URL and query indexes
- Live polling progress, searchable/filterable/sortable job table, detail tabs, retries, and deletion
- Editable wanted/unwanted stacks and scraper settings
- Interview pipeline with linked jobs, schedules, contacts, preparation, outcomes, status history, filters, and detailed records

## Stack

Next.js App Router, React, strict TypeScript, MongoDB's official Node.js driver, Playwright, Cheerio, native `fetch`, Tailwind CSS, Zod, and `sanitize-html`.

## Local setup

1. Install Node.js 20.9 or newer and run:

   ```bash
   npm install
   ```

2. Install Chromium for Playwright:

   ```bash
   npx playwright install chromium
   ```

3. Copy `.env.example` to `.env.local` and configure MongoDB:

   ```env
   MONGODB_URI=mongodb://localhost:27017
   MONGODB_DB_NAME=jobchecker
   ```

4. Start MongoDB locally or provide a MongoDB Atlas connection string, then run:

   ```bash
   npm run dev
   ```

Open `http://localhost:3000`. Collections and indexes are created on first use. The application uses `jobs`, `settings`, `analysis_runs`, and `interviews`.

For a production check and server:

```bash
npm run typecheck
npm run build
npm start
```

## Windows desktop app

Build a portable Windows executable with Electron:

```bash
npm run desktop:build
```

The command creates the guided installer `dist-electron/JobChecker-<version>-setup.exe`. It bundles the Next.js production application and a dedicated Playwright Chromium runtime, so no separate Node.js or browser installation is needed on the target Windows computer.

To build the optional single-file portable version instead, run `npm run desktop:portable`. Its standard filename is `JobChecker-<version>-portable.exe`.

The desktop app connects to `mongodb://localhost:27017` and uses the `jobchecker` database by default, so it opens directly without a setup prompt. To override either value, place a `JobChecker.env` file beside the executable using `.env.example` as the template.

For local Electron development using the existing production build, run:

```bash
npm run desktop:run
```

The generated executable is unsigned, so Windows SmartScreen may show an unknown-publisher warning. Production distribution should use a Windows code-signing certificate.

## How analysis works

`POST /api/jobs/check` creates an analysis run and processes normalized links with the configured concurrency (three by default). Each URL is saved in a processing state immediately. A normal HTTP request follows up to five validated redirects, caps response size, and enforces a timeout. The scraper then tries valid `JobPosting` JSON-LD, a domain adapter, and generic content selectors. If the description is still not useful, a reusable headless Chromium instance renders the page. Every result or failure is persisted independently, so one broken listing cannot abort the batch.

Technology rules live in `lib/detection/technology-catalog.ts`. Each rule has a canonical name, aliases, category, and optional precise regular expressions. Detection operates on sentence-sized context, counts mentions, stores up to three evidence excerpts, and assigns the strongest contextual importance. Short ambiguous terms such as Go use explicit contextual patterns; Java does not match JavaScript.

## Adding a technology

Add one entry to `TECHNOLOGIES` in `lib/detection/technology-catalog.ts`:

```ts
{
  name: "ExampleDB",
  category: "database",
  aliases: ["exampledb", "example db"]
}
```

For short or ambiguous names, omit aliases and provide context-aware `patterns` instead. The catalog is the single source used by detection and canonical settings matching.

## Adding a job-site parser

Implement the `JobScraper` interface from `types/scraping.ts` in `lib/scraping/providers/`. Its `canHandle` method selects URLs and `scrape` returns the shared `ScrapedJob` shape. Export one instance and register it in `lib/scraping/providers/index.ts`. Keep selectors and provider-specific behavior inside that adapter; generic cleanup and normalization should use the shared scraping utilities.

## API

- `POST /api/links/extract`
- `POST /api/jobs/check`
- `GET` / `DELETE /api/jobs`
- `GET` / `DELETE /api/jobs/:id`
- `POST /api/jobs/:id/recheck`
- `GET /api/runs/:id`
- `GET` / `PUT /api/settings`
- `GET` / `POST /api/interviews`
- `GET` / `PUT` / `PATCH` / `DELETE /api/interviews/:id`

The jobs endpoint supports `search`, `matchLevel`, `technology`, `source`, `remoteStatus`, `scrapeStatus`, `hasUnwanted`, `sortBy`, `sortOrder`, `page`, and `limit`.

## Known scraping limitations

- CAPTCHAs, login walls, strict bot protection, and pages that require human interaction can still fail.
- Some job providers change markup frequently. JSON-LD and generic extraction often compensate, but adapters may require selector updates.
- Playwright Chromium must be installed in every runtime environment.
- Background work started by an API route is suitable for a persistent Node.js server. Serverless platforms may suspend a request after its response; for those environments, connect the same `processBatch` function to a durable queue.
- Requirement and importance detection is deterministic text analysis. Unusual phrasing can be classified as merely mentioned.
- User-added settings affect matching immediately, but detection of a brand-new technology also requires a catalog rule.
