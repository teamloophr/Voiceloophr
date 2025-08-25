-- Create HR Documents table for storing uploaded documents and AI analysis
CREATE TABLE IF NOT EXISTS hr_documents (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    file_type VARCHAR(100) NOT NULL,
    file_size BIGINT NOT NULL,
    summary TEXT,
    embeddings VECTOR(1536), -- OpenAI text-embedding-3-small dimension
    metadata JSONB DEFAULT '{}',
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on embeddings for similarity search
CREATE INDEX IF NOT EXISTS hr_documents_embeddings_idx ON hr_documents USING ivfflat (embeddings vector_cosine_ops);

-- Create index on metadata for filtering
CREATE INDEX IF NOT EXISTS hr_documents_metadata_idx ON hr_documents USING GIN (metadata);

-- Create index on file type for filtering
CREATE INDEX IF NOT EXISTS hr_documents_file_type_idx ON hr_documents (file_type);

-- Create index on uploaded date for sorting
CREATE INDEX IF NOT EXISTS hr_documents_uploaded_at_idx ON hr_documents (uploaded_at DESC);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_hr_documents_updated_at 
    BEFORE UPDATE ON hr_documents 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE hr_documents ENABLE ROW LEVEL SECURITY;

-- Create policy for users to see only their own documents
CREATE POLICY "Users can view own documents" ON hr_documents
    FOR SELECT USING (auth.uid() = user_id);

-- Create policy for users to insert their own documents
CREATE POLICY "Users can insert own documents" ON hr_documents
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create policy for users to update their own documents
CREATE POLICY "Users can update own documents" ON hr_documents
    FOR UPDATE USING (auth.uid() = user_id);

-- Create policy for users to delete their own documents
CREATE POLICY "Users can delete own documents" ON hr_documents
    FOR DELETE USING (auth.uid() = user_id);

-- Create function for similarity search
CREATE OR REPLACE FUNCTION search_documents(
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
        AND hd.user_id = auth.uid()
    ORDER BY hd.embeddings <=> query_embedding
    LIMIT match_count;
END;
$$;
