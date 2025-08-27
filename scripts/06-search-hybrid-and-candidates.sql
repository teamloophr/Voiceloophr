-- Extensions
create extension if not exists vector;
create extension if not exists pg_trgm;

-- FTS column on hr_documents combining title, summary, content
alter table if exists hr_documents
  add column if not exists search_fts tsvector
  generated always as (
    setweight(to_tsvector('english', coalesce(title, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(summary, '')), 'B') ||
    setweight(to_tsvector('english', coalesce(content, '')), 'C')
  ) stored;

-- Index for FTS
create index if not exists hr_documents_search_fts_idx on hr_documents using gin (search_fts);

-- Admin hybrid search RPC (requires service role key)
drop function if exists search_documents_hybrid_admin(uuid, text, vector, float, int);
create or replace function search_documents_hybrid_admin(
  p_user_id uuid,
  query_text text,
  query_embedding vector(1536),
  alpha float default 0.5,
  match_count int default 20
)
returns table (
  id uuid,
  title varchar(255),
  content text,
  summary text,
  metadata jsonb,
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
      hd.id,
      hd.title,
      hd.content,
      hd.summary,
      hd.metadata,
      hd.file_type,
      hd.file_size,
      hd.uploaded_at,
      case when query_embedding is null or hd.embeddings is null then 0.0
           else 1 - (hd.embeddings <=> query_embedding) end as vector_score,
      ts_rank(hd.search_fts, websearch_to_tsquery('english', query_text)) as text_score,
      ts_headline(
        'english',
        coalesce(hd.content, ''),
        websearch_to_tsquery('english', query_text),
        'MaxFragments=2, MinWords=7, MaxWords=15, ShortWord=3'
      ) as snippet
    from hr_documents hd
    where hd.user_id = p_user_id
  )
  select
    id,
    title,
    content,
    summary,
    metadata,
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

-- Candidate profiles
create table if not exists candidates (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  full_name text,
  email text,
  phone text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, email)
);

create index if not exists idx_candidates_user on candidates(user_id);
create index if not exists idx_candidates_email_trgm on candidates using gin (email gin_trgm_ops);

create or replace function set_updated_at_candidates()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end; $$;

drop trigger if exists trg_candidates_updated_at on candidates;
create trigger trg_candidates_updated_at
before update on candidates
for each row execute function set_updated_at_candidates();

-- Association table
create table if not exists candidate_documents (
  candidate_id uuid references candidates(id) on delete cascade,
  document_id uuid references hr_documents(id) on delete cascade,
  relation text,
  created_at timestamptz not null default now(),
  primary key (candidate_id, document_id)
);

create index if not exists idx_candidate_documents_doc on candidate_documents(document_id);

-- RLS
alter table candidates enable row level security;
alter table candidate_documents enable row level security;

-- Candidates policies
drop policy if exists "Users can view own candidates" on candidates;
create policy "Users can view own candidates" on candidates
  for select using (auth.uid() = user_id);

drop policy if exists "Users can insert own candidates" on candidates;
create policy "Users can insert own candidates" on candidates
  for insert with check (auth.uid() = user_id);

drop policy if exists "Users can update own candidates" on candidates;
create policy "Users can update own candidates" on candidates
  for update using (auth.uid() = user_id);

drop policy if exists "Users can delete own candidates" on candidates;
create policy "Users can delete own candidates" on candidates
  for delete using (auth.uid() = user_id);

-- Candidate documents: infer ownership via candidate_id
drop policy if exists "Users can view own candidate_documents" on candidate_documents;
create policy "Users can view own candidate_documents" on candidate_documents
  for select using (exists (
    select 1 from candidates c
    where c.id = candidate_documents.candidate_id and c.user_id = auth.uid()
  ));

drop policy if exists "Users can insert own candidate_documents" on candidate_documents;
create policy "Users can insert own candidate_documents" on candidate_documents
  for insert with check (exists (
    select 1 from candidates c
    where c.id = candidate_documents.candidate_id and c.user_id = auth.uid()
  ));

drop policy if exists "Users can delete own candidate_documents" on candidate_documents;
create policy "Users can delete own candidate_documents" on candidate_documents
  for delete using (exists (
    select 1 from candidates c
    where c.id = candidate_documents.candidate_id and c.user_id = auth.uid()
  ));


