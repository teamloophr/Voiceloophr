# Bug Bounty: PDF Extraction Path Disclosure and Parsing Failure

## Summary
Uploading certain PDFs causes the extractor to fail and (previously) return absolute filesystem paths in error messages. This is both a reliability issue (analysis fails) and an information disclosure issue (server path leak).

- Impact: Upload/analysis fails; absolute path disclosure; noisy logs
- Component: `POST /api/documents/extract` (Next.js API route)
- Current status: Route now sanitizes filenames, forces byte-only parsing, and scrubs paths from errors. Still seeking robust fallback for scanned PDFs.

## Affected Versions
- App: VoiceLoopHR (Next.js 15) on branch `main`
- Libraries: `pdf-parse` (primary). Attempted `pdfjs-dist` ESM under Node led to DOM-related errors (e.g., DOMMatrix).

## Root Cause (observed)
1. Parser attempted to open a path rather than use uploaded bytes (ENOENT).
2. Raw server error strings were returned to the client (path leak).
3. pdf.js ESM under Node attempted to use DOM APIs.

## Reproduction
1. Start app.
2. Upload a PDF via chat UI.
3. Observe red bubble error with ENOENT/path (prior to mitigation) or parse failure.

## Security Concerns
- Information disclosure: absolute server path in client-visible message.
- Reliability: analysis fails for affected PDFs.

## Mitigations Implemented
- Sanitize filename to basename only.
- Byte-only parsing: `file.arrayBuffer()` -> `Buffer.from()` -> `pdf-parse`.
- Scrub absolute paths in returned error text (replace with `[path]`).

## Help Wanted / Proposed Fixes
- Keep `pdf-parse` default for digital PDFs.
- Add fallback when extracted text is empty or parse throws:
  - Option A: pdf.js text extraction under Node without DOM (workerless).
  - Option B: OCR fallback (Tesseract or service) for scanned PDFs.
- Add size/type validation and tests with digital/scanned fixtures.

## Acceptance Criteria
- Digital PDFs parse successfully (≥90% cases).
- Scanned PDFs parse when OCR fallback enabled.
- No absolute paths ever returned to client.

## Scope
- In: `/api/documents/extract`, error handling, fallback strategy.
- Out: Non-PDF formats (DOCX via `mammoth`), unrelated UI.

Please open a PR with a robust fallback implementation or recommendations.
