# DocMind AI

An AI-powered document summarizer SaaS app that uses Gemini 2.5 Flash to turn uploaded PDF/DOCX files into clean summaries, key points, and action items — with full history, search, and dark mode.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 8080)
- `pnpm --filter @workspace/docmind run dev` — run the React frontend
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string
- Required env: `GEMINI_API_KEY` — Google Gemini API key for AI summarization

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React + Vite, Tailwind CSS, shadcn/ui, next-themes (dark mode), wouter (routing)
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- AI: Google Gemini 2.5 Flash (`@google/genai`)
- File parsing: pdf-parse (PDF), mammoth (DOCX), multer (uploads)
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `lib/api-spec/openapi.yaml` — OpenAPI contract (source of truth)
- `lib/db/src/schema/summaries.ts` — Drizzle DB schema for summaries table
- `artifacts/api-server/src/routes/documents/index.ts` — Document upload + summary CRUD routes
- `artifacts/api-server/src/lib/gemini.ts` — Gemini AI summarization logic
- `artifacts/api-server/src/lib/document-parser.ts` — PDF/DOCX text extraction
- `artifacts/docmind/src/` — React frontend (pages, components, theme)

## Architecture decisions

- File uploads processed asynchronously: endpoint returns immediately with `status: processing`, background job runs extraction + Gemini, frontend polls until done
- PDF parsing via `pdf-parse`, DOCX via `mammoth` — both run server-side, no external service needed
- keyPoints and actionItems stored as JSON strings in Postgres (avoids extra join table)
- File uploads use native `fetch + FormData` on the frontend (multer multipart) rather than generated hook
- Summary processing happens in a `setImmediate` callback so the HTTP response is sent first

## Product

- Drag-and-drop PDF/DOCX upload with real-time processing status
- Gemini 2.5 Flash generates: 2-4 paragraph summary, 4-8 key points, 2-6 action items
- Summary history with search and file type filtering (PDF / DOCX)
- Stats dashboard (total docs, words processed, success/failure counts)
- Individual summary detail view with tabbed layout
- Dark mode with localStorage persistence

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

- After any OpenAPI spec change, run codegen before building: `pnpm --filter @workspace/api-spec run codegen`
- `format: binary` in OpenAPI breaks api-zod typecheck (no DOM lib) — use `type: string` for file fields and handle multipart with native fetch
- Gemini response is sometimes wrapped in markdown code fences — strip them before JSON.parse
- pdf-parse must be imported as `pdf-parse/lib/pdf-parse.js` (deep import) in ESM context

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
