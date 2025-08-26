-- Admin RPC for semantic search by explicit user_id (bypasses auth.uid())
-- Safe to call with service role key only.

CREATE OR REPLACE FUNCTION search_documents_admin(
    p_user_id UUID,
    query_embedding VECTOR(1536),
    similarity_threshold FLOAT DEFAULT 0.7,
    match_count INT DEFAULT 10
)
RETURNS TABLE (
    id UUID,
    title VARCHAR(255),
    content TEXT,
    summary TEXT,
    similarity FLOAT,
    metadata JSONB
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        hd.id,
        hd.title,
        hd.content,
        hd.summary,
        1 - (hd.embeddings <=> query_embedding) AS similarity,
        hd.metadata
    FROM hr_documents hd
    WHERE hd.embeddings IS NOT NULL
        AND 1 - (hd.embeddings <=> query_embedding) > similarity_threshold
        AND hd.user_id = p_user_id
    ORDER BY hd.embeddings <=> query_embedding
    LIMIT match_count;
END;
$$;


