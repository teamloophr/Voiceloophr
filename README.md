<p align="center">
  <img src="https://automationalien.s3.us-east-1.amazonaws.com/VoiceLoopLogoBlack.png" alt="VoiceLoopHR" width="200" />
</p>

# VoiceLoopHR

AI‑powered HR assistant — document analysis, semantic search, voice, and calendar integrations built on Next.js.

<p align="center">
  <a href="https://github.com/teamloophr/Voiceloophr">GitHub</a> ·
  <a href="#setup">Setup</a> ·
  <a href="#status">Status</a> ·
  <a href="#security--bug-bounty">Security</a>
</p>

---

## Status

- App: Next.js 15 + TypeScript
- PDF extraction: byte‑only `pdf-parse` (server) — scanning/OCR fallback planned
- Audit: `pnpm audit --prod` shows no known vulnerabilities
- Mobile: optimized; page scrollbar removed; internal areas scroll with hidden bars

> Found a bug? See [BUG_BOUNTY.md](./BUG_BOUNTY.md) for the PDF parsing bounty and how to help.

## Features

- Document upload and AI analysis (summary, key points, sentiment)
- Semantic search (Supabase + embeddings)
- Voice recording with Whisper transcription (server endpoint)
- TTS playback with play/pause/rewind/FF and speed toggle
- Guest mode + user settings (OpenAI key, ElevenLabs key, visual controls)
- Wave background with customizable hue and gradual color change

## Setup

### Prerequisites
- Node 20+
- pnpm 9+
- Supabase project (optional for persistence/search)

### 1) Install
```bash
pnpm install
```

### 2) Environment
Create `.env.local` in the project root:
```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# OpenAI (server preferred)
OPENAI_API_KEY=sk-...
# Optional public key for client-only demos
# NEXT_PUBLIC_OPENAI_API_KEY=sk-...

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 3) Database (optional)
Run `scripts/02-hr-documents-table.sql` in Supabase SQL editor to create `hr_documents` (pgvector).

### 4) Dev
```bash
pnpm dev
```

### 5) Build
```bash
pnpm build
pnpm start
```

## Architecture

- App Router (Next.js)
- API routes:
  - `POST /api/ai/transcribe` Whisper transcription
  - `POST /api/documents/extract` PDF/DOCX/TXT extraction (byte‑only)
  - `POST /api/documents` persist to Supabase (service role)
- Libraries: `pdf-parse` (PDF), `mammoth` (DOCX), `@supabase/supabase-js`

## Troubleshooting

- PDF fails with path‑like messages: paths are scrubbed; if text is empty, it’s likely a scanned PDF. OCR fallback is planned. See [BUG_BOUNTY.md](./BUG_BOUNTY.md).
- “Incorrect API key”: ensure your API key is valid or add it in Settings (guest mode) and refresh.
- Supabase insert error (UUID): table SQL applied and env vars set? Guests omit `user_id`.

## Scripts

```bash
pnpm audit --prod      # security audit (prod deps)
pnpm tsc --noEmit      # type check (requires TypeScript installed)
pnpm lint              # run lints (if configured)
```

## Security & Bug Bounty

See [BUG_BOUNTY.md](./BUG_BOUNTY.md) for the PDF extraction issue and mitigations.
Before pushing public:
- Ensure `.env*` files are ignored
- Run `pnpm audit --prod`
- Scan for secrets (e.g., secretlint/trufflehog)

## Contributing

PRs welcome for:
- OCR fallback for scanned PDFs
- Robust pdf.js workerless server extraction
- Improved search UI/filters

## License
TBD

---

Logo: `https://automationalien.s3.us-east-1.amazonaws.com/VoiceLoopLogoBlack.png`  
Repo: `https://github.com/teamloophr/Voiceloophr`