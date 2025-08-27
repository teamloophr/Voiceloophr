# Database Scripts

Run in this order (idempotent):

1. `02-hr-documents-table.sql`
2. `05-search-admin.sql`
3. `06-search-hybrid-and-candidates.sql`
4. `07-embeddings-maintenance.sql`
5. `08-security-audit-and-chunks.sql`

Notes:
- Use Supabase SQL editor or CLI. These scripts add vector indexes, FTS, hybrid search RPCs, candidate tables, audit logs, and chunking.
- Re-running is safe; IF NOT EXISTS is used where possible.

