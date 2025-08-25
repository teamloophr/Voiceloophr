# VoiceLoopHR Setup Guide

## 🚀 Quick Start

This guide will help you set up VoiceLoopHR with all the new AI-powered features including document analysis, voice transcription, and RAG-based search.

## 📋 Prerequisites

- Node.js 18+ and pnpm
- Supabase account and project
- OpenAI API key
- Git

## 🔧 Installation

### 1. Clone and Install Dependencies

```bash
git clone <your-repo-url>
cd Voiceloophr-main
pnpm install
```

### 2. Environment Configuration

Create a `.env.local` file in the root directory:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# OpenAI Configuration
OPENAI_API_KEY=your_openai_api_key

# Application Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 3. Database Setup

#### Option A: Using Supabase Dashboard

1. Go to your Supabase project dashboard
2. Navigate to SQL Editor
3. Run the SQL scripts in the `scripts/` folder:
   - `01-create-tables.sql` (if you haven't already)
   - `02-hr-documents-table.sql` (new table for HR documents)

#### Option B: Using Supabase CLI

```bash
# Install Supabase CLI
npm install -g supabase

# Login to Supabase
supabase login

# Link your project
supabase link --project-ref your-project-ref

# Run migrations
supabase db push
```

### 4. Enable Vector Extension

In your Supabase project, enable the `pgvector` extension:

```sql
-- Enable the vector extension
CREATE EXTENSION IF NOT EXISTS vector;
```

## 🎯 Features Overview

### ✅ **Implemented Features**

1. **AI-Powered Document Analysis**
   - PDF, Word, and text file processing
   - Automatic summarization using GPT-4
   - Key points extraction and sentiment analysis
   - Confidence scoring

2. **Voice Recording & Transcription**
   - High-quality audio recording
   - Whisper API integration for transcription
   - AI-powered HR insights from voice queries

3. **RAG-Based Document Search**
   - Vector embeddings for semantic search
   - Similarity-based document retrieval
   - Advanced filtering and sorting

4. **Enhanced Chat Interface**
   - Multi-modal input (text, voice, files)
   - Real-time AI responses
   - Document context awareness

5. **Database Integration**
   - Supabase with vector search
   - Row-level security
   - Automatic metadata extraction

### 🔄 **In Progress**

- Calendar integration
- Advanced search filters
- User authentication
- Settings panel

## 🧪 Testing the Application

### 1. Start Development Server

```bash
pnpm dev
```

### 2. Test Document Upload

1. Navigate to the chat interface
2. Click the paperclip icon to upload a document
3. Try uploading a PDF, Word document, or text file
4. Watch the AI analysis in real-time

### 3. Test Voice Recording

1. Click the microphone icon to start recording
2. Speak a question about HR processes
3. Stop recording to see transcription and AI response

### 4. Test AI Chat

1. Type questions about HR topics
2. Ask about document analysis
3. Request candidate search help

## 🐛 Troubleshooting

### Common Issues

#### 1. OpenAI API Errors

```
Error: Failed to analyze document
```

**Solution**: Check your OpenAI API key and billing status

#### 2. Supabase Connection Issues

```
Error: Failed to store document in database
```

**Solution**: Verify your Supabase credentials and database setup

#### 3. Voice Recording Not Working

```
Error: Failed to start audio recording
```

**Solution**: Check microphone permissions in your browser

#### 4. File Upload Errors

```
Error: File type not supported
```

**Solution**: Ensure you're uploading supported file types (PDF, DOC, DOCX, TXT)

### Debug Mode

Enable debug logging by adding to your `.env.local`:

```env
DEBUG=true
NEXT_PUBLIC_DEBUG=true
```

## 🔒 Security Considerations

1. **API Keys**: Never commit API keys to version control
2. **Row Level Security**: Supabase RLS is enabled by default
3. **File Validation**: All uploaded files are validated for type and size
4. **User Isolation**: Users can only access their own documents

## 📚 API Reference

### AI Processing

```typescript
import { AIProcessor } from '@/lib/ai-processing'

// Document summarization
const analysis = await AIProcessor.summarizeDocument(content)

// Voice transcription
const transcription = await AIProcessor.transcribeAudio(audioBlob)

// Generate embeddings
const embeddings = await AIProcessor.generateEmbeddings(text)

// Process HR queries
const response = await AIProcessor.processHRQuery(query)
```

### Document Search

```typescript
import { DocumentSearch } from '@/lib/search-utils'

// Semantic search
const results = await DocumentSearch.semanticSearch({
  query: "React developer with 5+ years experience",
  similarityThreshold: 0.8
})

// Criteria-based search
const results = await DocumentSearch.searchByCriteria({
  keywords: ["React", "Node.js"],
  fileType: "application/pdf"
})
```

### File Processing

```typescript
import { FileProcessor } from '@/lib/file-utils'

// Extract text from files
const extractedText = await FileProcessor.extractText(file)

// Validate files
const validation = FileProcessor.validateFile(file)

// Get file info
const fileInfo = FileProcessor.getFileInfo(file)
```

## 🚀 Deployment

### Vercel Deployment

1. Connect your GitHub repository to Vercel
2. Add environment variables in Vercel dashboard
3. Deploy automatically on push to main branch

### Environment Variables for Production

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
OPENAI_API_KEY=your_openai_key
NEXT_PUBLIC_APP_URL=https://your-domain.com
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📞 Support

- **Documentation**: Check this README and inline code comments
- **Issues**: Create GitHub issues for bugs or feature requests
- **Discussions**: Use GitHub discussions for questions

## 🎉 What's Next?

The application is now ready for:
- Calendar integration development
- Advanced user management
- Mobile responsiveness improvements
- Performance optimization
- Additional AI model integrations

Happy coding! 🚀
