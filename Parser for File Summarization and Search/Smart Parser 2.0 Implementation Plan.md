## Smart Parser 2.0 — Implementation Plan

Version: 1.0  
Owner: Engineering  
Last updated: 2025-08-26

### Objectives
- Deliver multi-format parsing (PDF, WAV, MP4) with user-controlled save/delete.  
- Integrate Whisper for high-accuracy transcription and GPT for analysis/summaries.  
- Implement RAG-based semantic search with hybrid retrieval and relevance scoring.  
- Aggregate multi-document candidate profiles with provenance and audit trails.  
- Ship privacy, security, and operability: PII redaction, RBAC, logging, monitoring.

### Success Metrics (Go/No-Go)
- Transcription WER ≤ 10% on clear audio; robust on noisy speech with detectable fallbacks.  
- PDF text extraction accuracy ≥ 98% on native PDFs; OCR fallback success ≥ 90% on scans.  
- Semantic search P@5 ≥ 0.7 on curated queries; median query latency ≤ 1.0s (P95 ≤ 2.0s).  
- 60% reduction in manual review time in pilot; user satisfaction ≥ 4.0/5.  
- Zero critical security findings; full audit trail coverage.

## Architecture Overview
- Services (modular, can be monorepo modules initially):
  - File Processing Service: upload, validation, text/audio extraction, OCR fallback.
  - AI Analysis Service: GPT summaries, structured extraction (skills, edu, experience), quality scoring.
  - Search Service: embeddings, hybrid search (vector + BM25), RAG orchestration, ranking.
  - Candidate Service: profile association, aggregation, duplicate detection/merge.
  - Integration/Web App: UI, auth, RBAC, review-and-decide workflow.
- Data: PostgreSQL (+ pgvector), object storage (existing storage/Supabase buckets), queue (SQS/Redis) for async jobs.  
- Observability: metrics, traces, structured logs; dead-letter queues.

### Data Flow (happy path)
1) Upload → Validate → Route by type.  
2) Extract text/transcribe → Normalize → AI analysis → Produce structured summary.  
3) User reviews → Save (persist + embed) or Delete (purge).  
4) Search: query → embed + BM25 → hybrid retrieve → re-rank → present with scores/snippets.  
5) Candidate: associate docs to profiles; aggregate and flag conflicts with provenance.

## Milestones, Deliverables, Acceptance Criteria

### Phase 0: Foundations (Week 0–1)
- Deliverables:
  - Service boundaries decided; repo/module scaffolding; env/config management.
  - Database migrations: documents, processing_results, embeddings, candidates, associations, audit_logs.
  - Job queue + worker skeleton; storage bucket structure; secrets management.
- Acceptance:
  - Migrations apply/rollback cleanly; local + staging env parity; CI pipeline green.

### Phase 1: Core File Processing (Week 1–3)
- Deliverables:
  - PDF pipeline: native text extraction (pdfplumber), OCR fallback (Tesseract via OCR service).
  - Unified upload API with validation, mime sniffing, size limits, virus scan stub/hook.
  - Content normalization: page blocks, paragraphs, table detection (basic), metadata capture.
  - Review-and-decide UI v1 with batch upload and per-file status.
- Acceptance:
  - ≥ 98% extraction accuracy on native PDFs; OCR fallback invoked on scans.  
  - UI shows parsed preview; user can Save/Delete; deletion purges temp storage.

### Phase 2: Audio/Video + Whisper (Week 3–5)
- Deliverables:
  - WAV/MP4 ingestion; ffmpeg audio extraction and normalization.  
  - Whisper integration with chunking for >25MB; language auto-detect; timestamps.  
  - Transcription QA: confidence scoring, diarization placeholder (optional), retry/backoff.
- Acceptance:
  - WER ≤ 10% on clear audio test set; resilient on long files via chunking; MP4 handled.

### Phase 3: AI Analysis Engine (Week 5–7)
- Deliverables:
  - GPT prompts/templates for HR: summary, skills, experience, education, qualifications.  
  - Structured output schema with validation; confidence scores; guardrails for hallucinations.  
  - Caching and idempotency (content-hash keyed); rate-limit handling and retries.
- Acceptance:
  - ≥ 95% field extraction accuracy on labeled set; deterministic outputs pass schema validation.

### Phase 4: Semantic Search (RAG) (Week 7–10)
- Deliverables:
  - pgvector setup; embedding generation (OpenAI or Sentence-Transformers) with versioning.  
  - Chunking strategy (semantic + fixed fallback), store chunk metadata and provenance.  
  - Hybrid search: vector + BM25; re-ranking; snippet generation with highlighting.  
  - RAG answer synthesis with source citations; guardrails for unsupported questions.
- Acceptance:
  - P@5 ≥ 0.7 on curated benchmark; P95 latency ≤ 2.0s with 100k chunks; sources cited.

### Phase 5: Candidate Management (Week 10–12)
- Deliverables:
  - Candidate profiles; auto-association via name/email/entity extraction; manual override.  
  - Multi-document aggregation with conflict detection; duplicate detection/merge workflow.  
  - Candidate-scoped search and profile view with provenance.
- Acceptance:
  - ≥ 90% correct auto-association on test set; merge creates consistent, auditable profile.

### Phase 6: Security, Privacy, Ops (Week 12–14)
- Deliverables:
  - RBAC integration; audit logging; PII redaction options; data retention policies.  
  - Rate limits, input validation, AV scan integration, content safety checks.  
  - Observability dashboards, alerts, DLQ processing, backfill tooling.
- Acceptance:
  - Zero critical security findings; full auditability of lifecycle operations.

### Phase 7: UX Polish, Beta, GA (Week 14–16)
- Deliverables:
  - Review UI v2: confidence indicators, error surfacing, bulk actions.  
  - Search UI: filters, facets, score display, quick previews, source download.  
  - Beta rollout plan, migration docs, playbooks; GA readiness checklist.
- Acceptance:
  - Pilot CSAT ≥ 4.0/5; performance SLOs met; known issues triaged.

## Workstreams and Key Tasks

### A. Data & Schema
- Tables: documents, processing_results, embeddings (vector, dim, model, version), candidates, candidate_documents, audit_logs.  
- Indexes: GIN for BM25, ivfflat/hnsw for vectors, composite keys on user/org scopes.

### B. File Processing
- Validators: size/mime/extension, AV scan hook, safe filename policy.  
- PDF: pdfplumber → text blocks; OCR service fallback with page mapping.  
- Media: ffmpeg normalize; Whisper API client with chunking, stitching, timestamps.

### C. AI Analysis
- Prompt templates; JSON schema validation; retry with temperature/backoff.  
- Confidence scoring from multiple signals (model logprobs/heuristics/consistency).  
- Caching/idempotency; content deduplication.

### D. Search/RAG
- Embedding pipeline (batch + incremental); chunking heuristics; embedding versioning.  
- Hybrid retrieval, re-ranking; snippet extraction with overlap; result scoring.  
- RAG synthesis with grounding to top-k; refusal policy when low confidence.

### E. Candidate Management
- Entity extraction for names/emails; fuzzy matching; manual link/unlink UI.  
- Duplicate detection, merge, and provenance preservation; audit entries on changes.

### F. UX & Access
- Review-and-decide flows; batch operations; confidence badges; error handling.  
- Search UI: query assist, filters, scores, previews, jump-to-source.  
- RBAC enforcement on all endpoints; access checks in UI routes.

### G. Ops & Quality
- CI: lint, type-check, unit/integration/e2e suites; seeded test data.  
- Monitoring: latency, throughput, error rates, WER, extraction accuracy, search KPIs.  
- Backfills/migrations; DLQ reprocessors; configuration management.

## APIs (representative)
- POST /files: upload; returns processing_job_id.  
- GET /processing/:id: status, preview content, errors.  
- POST /processing/:id/decision: { action: save|delete }.  
- GET /search: q, filters → results with score, snippets, sources.  
- GET /candidates/:id: profile with docs; POST /candidates/associate.

## Testing Strategy
- Unit: extractors, parsers, prompt formatters, scorers.  
- Integration: end-to-end pipelines (upload → preview → save → search).  
- Performance: 100k–1M chunks; latency SLOs; backpressure tests.  
- Quality: labeled sets for WER and field extraction; search relevance benchmark.

## Security & Privacy
- RBAC across services; signed URLs for file access; encryption at rest/in transit.  
- PII redaction toggle; retention policies; right-to-delete path including embeddings.  
- Audit logs for uploads, saves, deletes, associations, merges, searches (aggregated).

## Risks & Mitigations
- External API limits: queueing, retries, fallback to local models for embeddings.  
- OCR variability: quality checks, page-level fallbacks, human-in-the-loop for low confidence.  
- Search drift: embedding versioning, evaluation harness, periodic re-embeddings.  
- Cost control: batching, caching, sampling; tiered model selection.

## Rollout Plan
- Dev → Staging with seeded anonymized data.  
- Pilot with selected users; collect feedback/metrics.  
- GA with migration scripts, runbooks, on-call rotation, dashboards/alerts.

## Acceptance Checklist (GA)
- KPIs met (WER, extraction, P@5, latency).  
- Security review passed; data privacy controls verified.  
- Observability in place; playbooks tested; backups and restores validated.  
- Documentation: API, runbooks, user guides, admin configuration.




