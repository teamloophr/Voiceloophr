## Unified Chat + RAG Search: Status and Challenges

### Current Status
- Upload → Extract → Embed → Search → Retrieve integrated end-to-end.
- Originals saved to Supabase Storage (`documents/`) with metadata on `hr_documents`.
- Text extraction: PDF via pdf.js, DOCX via mammoth, audio via transcription; fallback to raw text.
- `/api/search`: vector search via `pgvector` with text-search fallback when embeddings fail.
- `/api/documents/[id]`: returns summary, plain text, and a 10‑minute signed URL to the original.
- Chat bar: lists top matches, shows top document summary + link, and (when user OpenAI key present) answers with RAG context.

### Known Challenges
- Embedding dependency: invalid/missing `OPENAI_API_KEY` reduces relevance; now mitigated with text fallback.
- Intent ambiguity: retrieval vs. analysis; simple heuristics in place.
- Long-document context: currently uses whole `content`; needs chunked RAG for large files.
- Observability: limited structured metrics (extraction/embedding/search timings, fallback rate).
- UX polish: more prominent result actions; richer snippets/highlights.

### Next Steps
1. Chunking + passage ranking for RAG (store chunk embeddings; return matched snippets).
2. Intent classifier (retrieve/open/summarize/answer) to improve responses.
3. Telemetry: per-stage timings, fallback counters, zero-result queries.
4. UI: inline preview for PDFs, clearer “Open/Summarize/Read aloud” CTAs.
5. Ops: banner when embeddings are disabled; guide to set API key.

### Operational Checklist
- Supabase: `vector` extension, `hr_documents` table, `search_documents_admin` RPC, Storage bucket `documents` with policies.
- Env: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `OPENAI_API_KEY`.

### Recent Changes (this branch)
- Added robust extraction (pdf.js, mammoth), storage upload + metadata, signed URL retrieval.
- Search endpoint made resilient with text fallback; chat wired to show results and link.


