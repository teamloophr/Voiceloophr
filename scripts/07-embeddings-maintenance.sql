-- Track embedding metadata/version
alter table if exists hr_documents
  add column if not exists embedding_model text,
  add column if not exists embedding_version text,
  add column if not exists embedding_updated_at timestamptz;

-- Helper view to find docs missing embeddings
create or replace view v_docs_missing_embeddings as
select id, user_id, title
from hr_documents
where embeddings is null
   or embedding_updated_at is null
   or coalesce(embedding_model, '') = '';


