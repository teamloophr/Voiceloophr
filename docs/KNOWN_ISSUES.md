# KNOWN ISSUES and Fixes

## 1) Signup 401 or No Confirmation Email
- Ensure `.env.local` has:
  - `NEXT_PUBLIC_SUPABASE_URL=https://<PROJECT_REF>.supabase.co`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY=<ANON_KEY>`
- Restart dev server after env change.
- Supabase Dashboard → Auth → Email: enable Email and Confirm email.
- Auth → URL configuration: add `http://localhost:3000` to Site URL and Redirect URLs.
- Test anon key with curl (replace project/key):
```bash
curl -i -X POST "https://<PROJECT_REF>.supabase.co/auth/v1/signup" \
  -H "apikey: <ANON_KEY>" -H "Authorization: Bearer <ANON_KEY>" \
  -H "Content-Type: application/json" \
  -d '{"email":"you+test@domain.com","password":"Password1234!"}'
```

## 2) Search returns no results (hybrid/vector)
- Ensure SQL 02, 05, 06, 07, 08 are applied in Supabase SQL editor.
- Server has `OPENAI_API_KEY` set (no quotes). Restart server.
- Use a real signed-in user (guest mode passes non-UUID and RPC rejects it).
- Upload a document; verify:
```sql
select count(*) from hr_documents where user_id = '<UUID>';
select count(*) from hr_document_chunks;
```

## 3) Embeddings backfill needed
Use the endpoint to backfill per user:
```bash
curl -X POST http://localhost:3000/api/embeddings/backfill \
  -H "Content-Type: application/json" \
  -d '{"userId":"<UUID>","limit":100}'
```

## 4) Missing RPC or table errors
Re-run `scripts/08-security-audit-and-chunks.sql` in SQL Editor.

## 5) Whisper transcription errors
- Provide `OPENAI_API_KEY` or header `x-openai-api-key`.
- Large files: prefer chunked upload; server does naive chunking.

---
Last updated: 2025-08-26
