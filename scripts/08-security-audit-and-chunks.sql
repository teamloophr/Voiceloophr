-- Security, audit logging, and document chunking support
-- Safe to run multiple times; uses IF NOT EXISTS where possible

-- Ensure extensions
create extension if not exists vector;
create extension if not exists pg_trgm;

-- Audit logs table
create table if not exists audit_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  action text not null,
  resource_type text,
  resource_id text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_audit_logs_user_created on audit_logs(user_id, created_at desc);

-- RLS optional for audit logs (typically admin-only). Keep disabled for now or scope to org later.

-- Chunk table for semantic search
create table if not exists hr_document_chunks (
  id uuid primary key default gen_random_uuid(),
  document_id uuid references hr_documents(id) on delete cascade,
  chunk_index int not null,
  content text not null,
  embeddings vector(1536),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_hr_document_chunks_doc on hr_document_chunks(document_id);
create index if not exists idx_hr_document_chunks_vec on hr_document_chunks using ivfflat (embeddings vector_cosine_ops);

-- Generated FTS for chunks
alter table if exists hr_document_chunks
  add column if not exists search_fts tsvector
  generated always as (
    setweight(to_tsvector('english', coalesce(content, '')), 'B')
  ) stored;

create index if not exists hr_document_chunks_fts_idx on hr_document_chunks using gin (search_fts);

-- Hybrid search across chunks (admin context)
drop function if exists search_document_chunks_hybrid_admin(uuid, text, vector, float, int);
create or replace function search_document_chunks_hybrid_admin(
  p_user_id uuid,
  query_text text,
  query_embedding vector(1536),
  alpha float default 0.5,
  match_count int default 30
)
returns table (
  document_id uuid,
  chunk_id uuid,
  title varchar(255),
  chunk_index int,
  chunk_content text,
  file_type varchar(100),
  file_size bigint,
  uploaded_at timestamptz,
  vector_score float,
  text_score float,
  hybrid_score float,
  snippet text
)
language sql
as $$
  with ranked as (
    select
      c.id as chunk_id,
      c.document_id,
      c.chunk_index,
      c.content as chunk_content,
      d.title,
      d.file_type,
      d.file_size,
      d.uploaded_at,
      case when query_embedding is null or c.embeddings is null then 0.0
           else 1 - (c.embeddings <=> query_embedding) end as vector_score,
      ts_rank(c.search_fts, websearch_to_tsquery('english', query_text)) as text_score,
      ts_headline(
        'english',
        coalesce(c.content, ''),
        websearch_to_tsquery('english', query_text),
        'MaxFragments=2, MinWords=7, MaxWords=15, ShortWord=3'
      ) as snippet
    from hr_document_chunks c
    join hr_documents d on d.id = c.document_id
    where d.user_id = p_user_id
  )
  select
    document_id,
    chunk_id,
    title,
    chunk_index,
    chunk_content,
    file_type,
    file_size,
    uploaded_at,
    vector_score,
    text_score,
    (coalesce(alpha, 0.5) * vector_score) + ((1 - coalesce(alpha, 0.5)) * text_score) as hybrid_score,
    snippet
  from ranked
  order by hybrid_score desc nulls last
  limit match_count;
$$;

-- Strengthen RLS policies on hr_documents if missing (user can only see own rows)
alter table hr_documents enable row level security;
do $$ begin
  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'hr_documents' and policyname = 'Users can view own documents'
  ) then
    create policy "Users can view own documents" on hr_documents for select using (auth.uid() = user_id);
  end if;
  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'hr_documents' and policyname = 'Users can insert own documents'
  ) then
    create policy "Users can insert own documents" on hr_documents for insert with check (auth.uid() = user_id);
  end if;
  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'hr_documents' and policyname = 'Users can update own documents'
  ) then
    create policy "Users can update own documents" on hr_documents for update using (auth.uid() = user_id);
  end if;
  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'hr_documents' and policyname = 'Users can delete own documents'
  ) then
    create policy "Users can delete own documents" on hr_documents for delete using (auth.uid() = user_id);
  end if;
end $$;


