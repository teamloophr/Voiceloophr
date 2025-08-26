# Developer Instructions: Enhancing Voiceloophr with Semantic Search and Resume Parsing

**Author: Manus AI**

## 1. Introduction

This document provides comprehensive developer instructions for integrating advanced semantic search capabilities for documents and media files, and a robust resume parsing feature with user profile auto-completion into the existing Voiceloophr platform. The goal is to enable users to semantically search through their uploaded documents and media (resumes, audio, video) and to automatically populate their user profiles by parsing resume content.

## 2. Architectural Overview

The proposed architecture extends the current Voiceloophr system by introducing a new data pipeline for content ingestion, processing, and semantic indexing. This pipeline leverages Supabase for both raw file storage and metadata/embedding management, and integrates with external AI/ML services for embedding generation and intelligent parsing. The existing Next.js frontend and API routes will be enhanced to support these new functionalities.

For a detailed visual representation, please refer to the `architecture_design.png` diagram.

## 3. Core Concepts and Technologies

### 3.1. Semantic Search

Semantic search moves beyond traditional keyword matching by understanding the meaning and context of a query. This is achieved through vector embeddings and vector similarity search.

-   **Embeddings**: Numerical representations of text, audio, or video content that capture their semantic meaning. Content with similar meanings will have embeddings that are numerically close to each other in a multi-dimensional space.
-   **Vector Databases**: Specialized databases optimized for storing and querying these high-dimensional vector embeddings, enabling efficient similarity searches.

### 3.2. Key Technologies

-   **Next.js**: The existing framework for both frontend and API routes.
-   **Supabase**: Utilized for:
    -   **Authentication**: Existing user management.
    -   **PostgreSQL Database**: For structured data, metadata, and user profiles.
    -   **Supabase Storage**: For storing raw document and media files.
    -   **`pgvector` Extension**: For storing and querying vector embeddings directly within PostgreSQL.
-   **AI/ML Services**: External APIs or models for:
    -   **Embedding Generation**: Converting content into vector embeddings (e.g., OpenAI Embeddings, Hugging Face models).
    -   **Speech-to-Text**: Transcribing audio content (e.g., OpenAI Whisper).
    -   **Resume Parsing**: Extracting structured data from resumes.

## 4. Implementation Details

### 4.1. Database Schema Modifications

To support the new features, the following tables will be added or modified in your Supabase PostgreSQL database. Ensure you have the `pgvector` extension enabled.

#### `documents` table

This table will store metadata about all uploaded documents and media files.

```sql
CREATE TABLE documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    filename TEXT NOT NULL,
    file_type TEXT NOT NULL, -- e.g., 'pdf', 'wav', 'mp4'
    storage_path TEXT NOT NULL, -- Path in Supabase Storage
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    status TEXT DEFAULT 'processing', -- 'processing', 'ready', 'failed'
    extracted_text TEXT, -- For text content from PDFs, audio transcripts
    -- Add other relevant metadata fields as needed
);
```

#### `embeddings` table

This table will store the vector embeddings generated from the documents and media. It requires the `pgvector` extension.

```sql
CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE embeddings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    document_id UUID REFERENCES documents(id) ON DELETE CASCADE NOT NULL,
    embedding VECTOR(1536), -- Dimension depends on the embedding model used (e.g., OpenAI text-embedding-ada-002 is 1536)
    -- Add other metadata related to embedding if necessary (e.g., chunk_id for large documents)
);
```

#### `user_profiles` table (Example - extend as needed)

This table will store structured user profile data, which can be populated from parsed resumes.

```sql
CREATE TABLE user_profiles (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT,
    email TEXT,
    phone_number TEXT,
    linkedin_profile TEXT,
    -- Resume-specific fields
    experience JSONB, -- Array of experience objects
    education JSONB, -- Array of education objects
    skills TEXT[], -- Array of strings
    -- Other profile fields
);
```

### 4.2. Supabase Storage Configuration

Configure Supabase Storage buckets and policies for raw file storage. It's recommended to create separate buckets for different file types for better organization and policy management.

-   **Create Buckets**: For example, `resumes`, `audio_recordings`, `general_documents`.
-   **Set up Policies**: Implement Row Level Security (RLS) policies on these buckets to ensure users can only upload and access their own files. Example policy for a `resumes` bucket:

    ```sql
    -- Enable RLS on the bucket
    ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

    -- Policy for users to insert their own files
    CREATE POLICY "Allow individual insert" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'resumes' AND auth.uid() = owner);

    -- Policy for users to select their own files
    CREATE POLICY "Allow individual select" ON storage.objects FOR SELECT USING (bucket_id = 'resumes' AND auth.uid() = owner);

    -- Policy for users to delete their own files
    CREATE POLICY "Allow individual delete" ON storage.objects FOR DELETE USING (bucket_id = 'resumes' AND auth.uid() = owner);
    ```

### 4.3. Frontend Development (Next.js)

#### 4.3.1. Navbar Icon and Modal

Create a new component for the navbar icon and the associated modal for document/resume uploads.

-   **Icon**: Add a new icon to your existing `components/layout/Navbar.tsx` (or similar) file. As per the user's request, a single person icon would be appropriate to complement the existing two-person icon, signifying personal document/profile management.
-   **Modal**: Design a `DocumentUploadModal.tsx` component. This modal should be minimalistic, with a centered text box for drag-and-drop functionality and clear visual cues (icons) for upload status. Avoid verbose text instructions. Ensure it adheres to the existing theme (light/dark mode).

    ```typescript
    // components/DocumentUploadModal.tsx (simplified example)
    import React, { useState } from 'react';
    import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog'; // Assuming Shadcn UI
    import { Input } from './ui/input';
    import { Button } from './ui/button';
    import { UploadCloud, FileText, Music, Video } from 'lucide-react'; // Example icons

    interface DocumentUploadModalProps {
      isOpen: boolean;
      onClose: () => void;
    }

    export function DocumentUploadModal({ isOpen, onClose }: DocumentUploadModalProps) {
      const [selectedFile, setSelectedFile] = useState<File | null>(null);
      const [isUploading, setIsUploading] = useState(false);

      const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files && event.target.files[0]) {
          setSelectedFile(event.target.files[0]);
        }
      };

      const handleUpload = async () => {
        if (!selectedFile) return;

        setIsUploading(true);
        const formData = new FormData();
        formData.append('file', selectedFile);

        try {
          const response = await fetch('/api/ingest', {
            method: 'POST',
            body: formData,
          });

          if (response.ok) {
            alert('File uploaded successfully!');
            onClose();
          } else {
            alert('File upload failed.');
          }
        } catch (error) {
          console.error('Upload error:', error);
          alert('An error occurred during upload.');
        } finally {
          setIsUploading(false);
          setSelectedFile(null);
        }
      };

      return (
        <Dialog open={isOpen} onOpenChange={onClose}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Upload Document or Media</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 p-6 rounded-lg">
                {selectedFile ? (
                  <p className="text-center">Selected: {selectedFile.name}</p>
                ) : (
                  <div className="text-center">
                    <UploadCloud className="mx-auto h-12 w-12 text-gray-400" />
                    <p className="mt-2 text-sm text-gray-600">Drag and drop files here, or click to select</p>
                  </div>
                )}
                <Input
                  id="file-upload"
                  type="file"
                  className="sr-only"
                  onChange={handleFileChange}
                />
                <label
                  htmlFor="file-upload"
                  className="mt-4 inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Select File
                </label>
              </div>
            </div>
            <Button onClick={handleUpload} disabled={!selectedFile || isUploading}>
              {isUploading ? 'Uploading...' : 'Upload'}
            </Button>
          </DialogContent>
        </Dialog>
      );
    }
    ```

#### 4.3.2. Semantic Search Interface

Integrate a search input field into your application (e.g., within the existing chat interface or a new dedicated search page). When a user submits a query, it should be sent to the new `/api/search` endpoint.

-   **Display Results**: Render the search results, showing relevant document/media titles, types, and potentially snippets of extracted text. Provide links to view or download the original files from Supabase Storage.

#### 4.3.3. User Profile Template

Extend your user profile pages to display and allow editing of the structured data parsed from resumes. This will involve mapping the `user_profiles` table fields to your frontend forms.

### 4.4. Backend Development (Next.js API Routes)

#### 4.4.1. `/api/ingest` (File Upload and Initial Processing Trigger)

This API route will handle file uploads, store them in Supabase Storage, and record metadata in the `documents` table. It will then trigger the asynchronous processing pipeline.

-   **File Upload**: Use `formidable` or `multer` (if you're using Express-like middleware) to handle multipart form data for file uploads. Alternatively, directly use the `request.body` if handling raw binary streams.
-   **Supabase Storage Upload**: Use the Supabase JavaScript client library to upload the file to the appropriate bucket (e.g., `resumes`, `audio_recordings`, `general_documents`).
-   **Database Entry**: After successful upload, insert a new record into the `documents` table with file metadata.
-   **Trigger Processing**: This is a critical step. You can use several methods:
    -   **Supabase Edge Functions**: Configure a Supabase Storage trigger that invokes an Edge Function upon file upload. This function then orchestrates the embedding generation and parsing.
    -   **API Route Direct Call**: The `/api/ingest` route can directly call an internal function or another API route (e.g., `/api/process-document`) to start the processing. For long-running tasks, consider a background job queue.

    ```typescript
    // pages/api/ingest.ts (simplified example)
    import { NextApiRequest, NextApiResponse } from 'next';
    import { createClient } from '@supabase/supabase-js';
    import { IncomingForm } from 'formidable';
    import fs from 'fs';

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    export const config = {
      api: {
        bodyParser: false, // Disable Next.js body parser to handle file uploads
      },
    };

    export default async function handler(req: NextApiRequest, res: NextApiResponse) {
      if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method Not Allowed' });
      }

      const form = new IncomingForm();

      form.parse(req, async (err, fields, files) => {
        if (err) {
          console.error('Error parsing form:', err);
          return res.status(500).json({ message: 'Error parsing form data' });
        }

        const file = files.file?.[0];

        if (!file) {
          return res.status(400).json({ message: 'No file uploaded' });
        }

        const filePath = file.filepath;
        const filename = file.originalFilename || 'untitled';
        const fileType = file.mimetype || 'application/octet-stream';
        const userId = (await supabase.auth.getUser()).data.user?.id; // Get user ID from session

        if (!userId) {
          return res.status(401).json({ message: 'Unauthorized' });
        }

        const bucketName = getBucketName(fileType); // Implement this helper function
        const storagePath = `${userId}/${Date.now()}-${filename}`;

        try {
          const { data, error: uploadError } = await supabase.storage
            .from(bucketName)
            .upload(storagePath, fs.createReadStream(filePath), {
              contentType: fileType,
              upsert: false,
            });

          if (uploadError) {
            console.error('Supabase upload error:', uploadError);
            return res.status(500).json({ message: 'Failed to upload file to storage' });
          }

          const { data: documentData, error: dbError } = await supabase
            .from('documents')
            .insert({
              user_id: userId,
              filename: filename,
              file_type: fileType,
              storage_path: storagePath,
              status: 'processing',
            })
            .select();

          if (dbError) {
            console.error('Supabase DB insert error:', dbError);
            return res.status(500).json({ message: 'Failed to record document metadata' });
          }

          // Trigger asynchronous processing (e.g., call another internal API route or Edge Function)
          // await fetch('/api/process-document', { method: 'POST', body: JSON.stringify({ documentId: documentData[0].id }) });

          return res.status(200).json({ message: 'File uploaded and processing initiated', documentId: documentData[0].id });
        } catch (error) {
          console.error('Server error:', error);
          return res.status(500).json({ message: 'Internal server error' });
        } finally {
          fs.unlink(filePath, (err) => {
            if (err) console.error('Error deleting temp file:', err);
          });
        }
      });
    }

    function getBucketName(fileType: string): string {
      if (fileType.startsWith('application/pdf')) return 'resumes'; // Or 'general_documents'
      if (fileType.startsWith('audio/')) return 'audio_recordings';
      if (fileType.startsWith('video/')) return 'video_recordings';
      return 'general_documents';
    }
    ```

#### 4.4.2. `/api/process-document` (Asynchronous Document Processing)

This internal API route (or Edge Function) will handle the heavy lifting of content extraction and embedding generation. It should be called asynchronously after a file is uploaded.

-   **Content Retrieval**: Fetch the uploaded file from Supabase Storage.
-   **Content Type Handling**: Based on `file_type`:
    -   **PDF**: Use a library like `pdf-parse` or integrate with a cloud-based OCR service (e.g., Google Cloud Vision, AWS Textract) to extract text. For local processing, `pdf.js` can be used on the server-side.
    -   **Audio (WAV)**: Send the audio file to a speech-to-text service (e.g., OpenAI Whisper API) to get a transcription. Store the transcription in the `extracted_text` field of the `documents` table.
    -   **Video (MP4)**: Extract audio for transcription. For visual content, consider extracting keyframes and using an image-to-text model (like CLIP) or a dedicated video understanding API (e.g., Twelve Labs). Store relevant textual descriptions.
-   **Embedding Generation**: Send the extracted text (or other relevant data) to an embedding service (e.g., OpenAI Embeddings API). The `text-embedding-ada-002` model is a good starting point, producing 1536-dimensional vectors.
-   **Store Embeddings**: Insert the generated embedding into the `embeddings` table, linking it to the `document_id`.
-   **Update Document Status**: Update the `status` of the document in the `documents` table to `'ready'` or `'failed'` based on processing outcome.

    ```typescript
    // pages/api/process-document.ts (conceptual example)
    import { NextApiRequest, NextApiResponse } from 'next';
    import { createClient } from '@supabase/supabase-js';
    import axios from 'axios'; // For external API calls
    // import pdfParse from 'pdf-parse'; // For PDF text extraction
    // import { OpenAI } from 'openai'; // For OpenAI APIs

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, { auth: { persistSession: false } });

    // const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    export default async function handler(req: NextApiRequest, res: NextApiResponse) {
      if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method Not Allowed' });
      }

      const { documentId } = req.body;

      if (!documentId) {
        return res.status(400).json({ message: 'Document ID is required' });
      }

      try {
        // 1. Fetch document metadata
        const { data: document, error: docError } = await supabase
          .from('documents')
          .select('*')
          .eq('id', documentId)
          .single();

        if (docError || !document) {
          console.error('Error fetching document:', docError);
          return res.status(404).json({ message: 'Document not found' });
        }

        // 2. Download file from Supabase Storage
        const { data: fileData, error: downloadError } = await supabase.storage
          .from(getBucketName(document.file_type))
          .download(document.storage_path);

        if (downloadError || !fileData) {
          console.error('Error downloading file:', downloadError);
          await supabase.from('documents').update({ status: 'failed' }).eq('id', documentId);
          return res.status(500).json({ message: 'Failed to download file' });
        }

        let extractedText = '';

        // 3. Content Extraction (Conceptual - implement based on file type)
        if (document.file_type.startsWith('application/pdf')) {
          // Example: PDF text extraction
          // const pdfBuffer = Buffer.from(await fileData.arrayBuffer());
          // const data = await pdfParse(pdfBuffer);
          // extractedText = data.text;
          extractedText = 'Text extracted from PDF...'; // Placeholder
        } else if (document.file_type.startsWith('audio/')) {
          // Example: Audio transcription using OpenAI Whisper
          // const audioBlob = new Blob([fileData], { type: document.file_type });
          // const transcription = await openai.audio.transcriptions.create({
          //   file: audioBlob,
          //   model: "whisper-1",
          // });
          // extractedText = transcription.text;
          extractedText = 'Audio transcription...'; // Placeholder
        } else if (document.file_type.startsWith('video/')) {
          // Example: Video processing (extract audio, keyframes, etc.)
          extractedText = 'Video content description...'; // Placeholder
        }

        // 4. Generate Embeddings
        // const embeddingResponse = await openai.embeddings.create({
        //   model: "text-embedding-ada-002",
        //   input: extractedText,
        // });
        // const embedding = embeddingResponse.data[0].embedding;
        const embedding = Array(1536).fill(Math.random()); // Placeholder embedding

        // 5. Store Extracted Text and Embedding
        const { error: updateError } = await supabase
          .from('documents')
          .update({ extracted_text: extractedText, status: 'ready' })
          .eq('id', documentId);

        if (updateError) {
          console.error('Error updating document with extracted text:', updateError);
          return res.status(500).json({ message: 'Failed to update document with extracted text' });
        }

        const { error: embedError } = await supabase
          .from('embeddings')
          .insert({ document_id: documentId, embedding: embedding });

        if (embedError) {
          console.error('Error inserting embedding:', embedError);
          return res.status(500).json({ message: 'Failed to insert embedding' });
        }

        return res.status(200).json({ message: 'Document processed successfully' });
      } catch (error) {
        console.error('Processing error:', error);
        await supabase.from('documents').update({ status: 'failed' }).eq('id', documentId);
        return res.status(500).json({ message: 'Internal server error during processing' });
      }
    }

    function getBucketName(fileType: string): string {
      if (fileType.startsWith('application/pdf')) return 'resumes';
      if (fileType.startsWith('audio/')) return 'audio_recordings';
      if (fileType.startsWith('video/')) return 'video_recordings';
      return 'general_documents';
    }
    ```

#### 4.4.3. `/api/search` (Semantic Search Endpoint)

This API route will receive natural language queries, convert them into embeddings, perform a vector similarity search, and return relevant documents.

-   **Query Embedding**: Use the same embedding service as for documents to convert the user's natural language query into a vector embedding.
-   **Vector Similarity Search**: Query the `embeddings` table using `pgvector`'s similarity operators (e.g., `<=>` for cosine distance). You'll typically join this with the `documents` table to retrieve metadata.
-   **Filtering (Optional)**: Implement additional filters (e.g., by file type, upload date, user ID) based on user preferences.
-   **Return Results**: Return a list of relevant documents, including their metadata and a URL to access the original file from Supabase Storage.

    ```typescript
    // pages/api/search.ts (conceptual example)
    import { NextApiRequest, NextApiResponse } from 'next';
    import { createClient } from '@supabase/supabase-js';
    // import { OpenAI } from 'openai';

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    // const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    export default async function handler(req: NextApiRequest, res: NextApiResponse) {
      if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method Not Allowed' });
      }

      const { query } = req.body;

      if (!query) {
        return res.status(400).json({ message: 'Search query is required' });
      }

      try {
        // 1. Generate embedding for the user query
        // const queryEmbeddingResponse = await openai.embeddings.create({
        //   model: "text-embedding-ada-002",
        //   input: query,
        // });
        // const queryEmbedding = queryEmbeddingResponse.data[0].embedding;
        const queryEmbedding = Array(1536).fill(Math.random()); // Placeholder

        // 2. Perform vector similarity search using pgvector
        const { data: documents, error: searchError } = await supabase.rpc('match_documents', {
          query_embedding: queryEmbedding,
          match_threshold: 0.7, // Adjust threshold as needed
          match_count: 10, // Number of results to return
        });

        if (searchError) {
          console.error('Error during semantic search:', searchError);
          return res.status(500).json({ message: 'Semantic search failed' });
        }

        // 3. Attach public URLs for files
        const resultsWithUrls = documents.map((doc: any) => {
          const { data: publicUrl } = supabase.storage
            .from(getBucketName(doc.file_type))
            .getPublicUrl(doc.storage_path);
          return { ...doc, publicUrl: publicUrl.publicUrl };
        });

        return res.status(200).json({ results: resultsWithUrls });
      } catch (error) {
        console.error('Server error:', error);
        return res.status(500).json({ message: 'Internal server error' });
      }
    }

    // Example Supabase RPC function for semantic search (to be created in Supabase SQL editor)
    /*
    CREATE OR REPLACE FUNCTION match_documents (
      query_embedding vector(1536),
      match_threshold float,
      match_count int
    )
    RETURNS TABLE (
      id uuid,
      user_id uuid,
      filename text,
      file_type text,
      storage_path text,
      uploaded_at timestamp with time zone,
      status text,
      extracted_text text,
      similarity float
    ) LANGUAGE plpgsql AS $$
    #variable_conflict use_column
    BEGIN
      RETURN QUERY
      SELECT
        documents.id,
        documents.user_id,
        documents.filename,
        documents.file_type,
        documents.storage_path,
        documents.uploaded_at,
        documents.status,
        documents.extracted_text,
        1 - (embeddings.embedding <=> query_embedding) AS similarity
      FROM documents
      JOIN embeddings ON documents.id = embeddings.document_id
      WHERE 1 - (embeddings.embedding <=> query_embedding) > match_threshold
      ORDER BY similarity DESC
      LIMIT match_count;
    END;
    $$;
    */

    function getBucketName(fileType: string): string {
      if (fileType.startsWith('application/pdf')) return 'resumes';
      if (fileType.startsWith('audio/')) return 'audio_recordings';
      if (fileType.startsWith('video/')) return 'video_recordings';
      return 'general_documents';
    }
    ```

#### 4.4.4. `/api/process-resume` (Resume Parsing Endpoint)

This API route will handle the parsing of uploaded resumes and updating the user's profile.

-   **Resume Retrieval**: Fetch the resume file from Supabase Storage.
-   **Parsing Logic**: Integrate with a resume parsing library or API. This is a complex task, and you might consider:
    -   **Open-source Libraries**: Libraries like `python-docx` (for .docx), `pdfminer.six` (for PDF), or `spacy` for NLP-based extraction. This would require setting up a separate Python service.
    -   **Cloud APIs**: Services like Google Cloud Talent Solution, Amazon Textract (with custom parsing), or specialized resume parsing APIs (e.g., Affinda, Sovren) can provide structured data.
-   **Data Mapping**: Map the extracted resume data (e.g., name, experience, education, skills) to the fields in your `user_profiles` table.
-   **Profile Update**: Update the `user_profiles` table in Supabase with the parsed data.

    ```typescript
    // pages/api/process-resume.ts (conceptual example)
    import { NextApiRequest, NextApiResponse } from 'next';
    import { createClient } from '@supabase/supabase-js';
    // import axios from 'axios'; // For external resume parsing API

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, { auth: { persistSession: false } });

    export default async function handler(req: NextApiRequest, res: NextApiResponse) {
      if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method Not Allowed' });
      }

      const { documentId } = req.body; // Assuming documentId of the resume

      if (!documentId) {
        return res.status(400).json({ message: 'Document ID is required' });
      }

      try {
        // 1. Fetch resume document metadata
        const { data: resumeDoc, error: docError } = await supabase
          .from('documents')
          .select('*')
          .eq('id', documentId)
          .single();

        if (docError || !resumeDoc) {
          console.error('Error fetching resume document:', docError);
          return res.status(404).json({ message: 'Resume document not found' });
        }

        // 2. Download resume file from Supabase Storage
        const { data: fileData, error: downloadError } = await supabase.storage
          .from('resumes')
          .download(resumeDoc.storage_path);

        if (downloadError || !fileData) {
          console.error('Error downloading resume file:', downloadError);
          return res.status(500).json({ message: 'Failed to download resume file' });
        }

        // 3. Perform resume parsing (conceptual - integrate with actual parser)
        // This part is highly dependent on the chosen parsing solution.
        // Example with a hypothetical external API:
        // const parsingResponse = await axios.post('https://your-resume-parser-api.com/parse', fileData, {
        //   headers: { 'Content-Type': resumeDoc.file_type },
        // });
        // const parsedData = parsingResponse.data;

        const parsedData = {
          fullName: 'John Doe',
          email: 'john.doe@example.com',
          phone: '123-456-7890',
          experience: [{ title: 'Software Engineer', company: 'Tech Corp', years: '2020-Present' }],
          education: [{ degree: 'B.S. Computer Science', university: 'State University' }],
          skills: ['JavaScript', 'React', 'Node.js', 'Python'],
        }; // Placeholder parsed data

        // 4. Update user profile in Supabase
        const userId = resumeDoc.user_id;
        const { error: profileUpdateError } = await supabase
          .from('user_profiles')
          .upsert({
            user_id: userId,
            full_name: parsedData.fullName,
            email: parsedData.email,
            phone_number: parsedData.phone,
            experience: parsedData.experience,
            education: parsedData.education,
            skills: parsedData.skills,
          }, { onConflict: 'user_id' }); // Upsert to create or update

        if (profileUpdateError) {
          console.error('Error updating user profile:', profileUpdateError);
          return res.status(500).json({ message: 'Failed to update user profile' });
        }

        return res.status(200).json({ message: 'Resume parsed and profile updated successfully' });
      } catch (error) {
        console.error('Resume processing error:', error);
        return res.status(500).json({ message: 'Internal server error during resume processing' });
      }
    }
    ```

### 4.5. Environment Variables

Ensure the following environment variables are set in your `.env.local` file and in your deployment environment (e.g., Vercel, Amplify):

```dotenv
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
OPENAI_API_KEY=your_openai_api_key # If using OpenAI APIs
# Add other API keys for resume parsing services if applicable
```

## 5. Security Best Practices

-   **Row Level Security (RLS)**: Crucial for data isolation. Ensure RLS is enabled and correctly configured for `documents`, `embeddings`, `user_profiles` tables, and Supabase Storage buckets.
-   **API Key Management**: Never expose sensitive API keys (e.g., `SUPABASE_SERVICE_ROLE_KEY`, `OPENAI_API_KEY`) to the client-side. Use Next.js API routes for server-side operations that require these keys.
-   **Input Validation**: Always validate and sanitize user inputs and uploaded files to prevent injection attacks and malicious content.
-   **Error Handling and Logging**: Implement robust error handling and logging for all API routes and background processes to quickly identify and debug issues.
-   **Rate Limiting**: Consider implementing rate limiting on your API endpoints to prevent abuse.

## 6. Testing

-   **Unit Tests**: Write unit tests for your API routes and utility functions.
-   **Integration Tests**: Test the full workflow from file upload to semantic search and resume parsing.
-   **End-to-End Tests**: Use tools like Playwright or Cypress to simulate user interactions and verify the end-to-end functionality.

## 7. Deployment Considerations

-   **Vercel**: If deploying on Vercel, ensure all environment variables are correctly configured in the Vercel dashboard.
-   **Supabase**: Monitor your Supabase usage (database, storage, Edge Functions) to manage costs and performance.
-   **Scalability**: For high-volume applications, consider optimizing your embedding generation and resume parsing services for scalability (e.g., using serverless functions, dedicated microservices).

## 8. Conclusion

By following these instructions, you can successfully integrate semantic search and robust resume parsing into the Voiceloophr platform, significantly enhancing its capabilities and user experience. This will allow users to efficiently manage and retrieve their documents and media, and streamline the process of building their professional profiles.

## References

[1] Supabase Documentation: [https://supabase.com/docs](https://supabase.com/docs)
[2] OpenAI API Documentation: [https://platform.openai.com/docs/api-reference](https://platform.openai.com/docs/api-reference)
[3] `pgvector` GitHub Repository: [https://github.com/pgvector/pgvector](https://github.com/pgvector/pgvector)
[4] Next.js Documentation: [https://nextjs.org/docs](https://nextjs.org/docs)

---




![Architecture Diagram](https://private-us-east-1.manuscdn.com/sessionFile/kKN3v0PQJm1TQTq3tfMVWx/sandbox/5XPOfyMIJUiMh6QoosUDx7-images_1756183941603_na1fn_L2hvbWUvdWJ1bnR1L2FyY2hpdGVjdHVyZV9kZXNpZ24.png?Policy=eyJTdGF0ZW1lbnQiOlt7IlJlc291cmNlIjoiaHR0cHM6Ly9wcml2YXRlLXVzLWVhc3QtMS5tYW51c2Nkbi5jb20vc2Vzc2lvbkZpbGUva0tOM3YwUFFKbTFUUVRxM3RmTVZXeC9zYW5kYm94LzVYUE9meU1JSlVpTWg2UW9vc1VEeDctaW1hZ2VzXzE3NTYxODM5NDE2MDNfbmExZm5fTDJodmJXVXZkV0oxYm5SMUwyRnlZMmhwZEdWamRIVnlaVjlrWlhOcFoyNC5wbmciLCJDb25kaXRpb24iOnsiRGF0ZUxlc3NUaGFuIjp7IkFXUzpFcG9jaFRpbWUiOjE3OTg3NjE2MDB9fX1dfQ__&Key-Pair-Id=K2HSFNDJXOU9YS&Signature=LFHEiZQHjTGU3IaGcQm7Tjo~LYPW2qRuboZvDxbEE~YVXZtcEc0fL1tYxrZLJcHpKoyaA43gSDHb5lKOTu5CA3IMpvtM-XilaqUirKgDJyX1WRmQBqlUV~1C0TPh-CP3y-zZeEY7dqqVwzVJ9bPkdzO5LgVVcxQb6tvhn33l2WJU0DHEeVb9JmICzYHSnZ8tcFTF~iGfNdQxFF39krBplAtSjwfXkKtyZM3SYXbtyKg1Sdu~bCgC3YInuXUBdNtx9DCq949AQGdo~adYn~~SDnS6ZpiBDGc0fo-UUwqPfS8RntKbLR-iExrEr~KIQZjw4JsOECsVE5YwhaYXQnvHbQ__)


