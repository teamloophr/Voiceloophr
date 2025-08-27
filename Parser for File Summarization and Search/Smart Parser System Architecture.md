# Smart Parser System Architecture

## System Overview

The Smart Parser System is designed as a modular, scalable architecture that integrates OpenAI's Whisper for audio transcription, OpenAI's GPT models for document analysis, and a RAG-based semantic search system for intelligent candidate management. The system processes multiple file types (PDF, WAV, MP4) and provides users with control over file lifecycle management.

## Core Components

### 1. File Processing Engine
- **Multi-format Support**: Handles PDF documents, WAV audio files, and MP4 video files
- **Whisper Integration**: Utilizes OpenAI Whisper API for audio transcription from WAV and MP4 files
- **Document Parser**: Extracts text content from PDF files using robust parsing libraries
- **Content Normalization**: Standardizes extracted content for consistent processing

### 2. AI Analysis Layer
- **OpenAI GPT Integration**: Leverages GPT models for document summarization and content analysis
- **Contextual Understanding**: Maintains conversation context for improved analysis quality
- **Batch Processing**: Supports processing multiple files simultaneously for efficiency

### 3. RAG-based Semantic Search
- **Vector Database**: Stores document embeddings for semantic similarity matching
- **Embedding Generation**: Creates high-dimensional representations of document content
- **Semantic Retrieval**: Enables natural language queries against stored documents
- **Relevance Scoring**: Provides confidence scores for search results

### 4. User Control Interface
- **File Lifecycle Management**: Allows users to decide whether to save or delete processed files
- **Preview System**: Displays processing results before final save/delete decision
- **Batch Operations**: Supports bulk actions on multiple files

### 5. Candidate Management System
- **Profile Association**: Links documents to specific candidate profiles
- **Multi-document Aggregation**: Combines multiple files per candidate for comprehensive profiles
- **Original File Preservation**: Maintains access to original uploaded files alongside processed content
- **Relevance-based Ranking**: Orders search results by relevance scores

## Technical Stack

### Backend Services
- **Framework**: Flask with modular blueprint architecture
- **Database**: PostgreSQL with vector extension for embeddings
- **File Storage**: Local filesystem with organized directory structure
- **API Layer**: RESTful endpoints for all system operations

### AI/ML Components
- **OpenAI Whisper**: Audio transcription service
- **OpenAI GPT**: Text analysis and summarization
- **Sentence Transformers**: Local embedding generation for semantic search
- **Vector Database**: Pinecone or Chroma for embedding storage

### File Processing
- **PDF Processing**: PyPDF2 or pdfplumber for text extraction
- **Audio Processing**: FFmpeg for audio format conversion
- **Video Processing**: FFmpeg for audio extraction from MP4 files

## Data Flow Architecture

### File Upload and Processing
1. User uploads file(s) through web interface
2. File type detection and routing to appropriate processor
3. Content extraction (text from PDF, audio transcription from WAV/MP4)
4. AI-powered analysis and summarization
5. User review and save/delete decision
6. If saved: embedding generation and storage in vector database

### Search and Retrieval
1. User submits natural language query
2. Query embedding generation
3. Semantic similarity search in vector database
4. Relevance scoring and ranking
5. Results presentation with original file access

## Microservices Architecture

### File Processing Service
- Handles file upload and initial processing
- Manages file type detection and routing
- Coordinates with AI services for content analysis

### AI Analysis Service
- Integrates with OpenAI APIs
- Manages Whisper transcription requests
- Handles GPT-based document analysis

### Search Service
- Manages vector database operations
- Handles embedding generation and storage
- Processes search queries and returns ranked results

### Candidate Management Service
- Manages candidate profiles and associations
- Handles multi-document aggregation per candidate
- Provides candidate-specific search capabilities

## Scalability Considerations

### Horizontal Scaling
- Stateless service design for easy replication
- Load balancing across multiple service instances
- Database connection pooling for efficient resource usage

### Performance Optimization
- Asynchronous processing for long-running operations
- Caching layer for frequently accessed data
- Batch processing capabilities for bulk operations

### File Size Management
- Individual service files kept under 1000 lines as specified
- Modular design with clear separation of concerns
- Microservices pattern for independent scaling

## Security and Privacy

### Data Protection
- Encryption at rest for stored files and embeddings
- Secure API key management for OpenAI services
- User authentication and authorization

### File Access Control
- User-specific file isolation
- Role-based access to candidate information
- Audit logging for file operations

## Integration Points

### Existing Voiceloophr Integration
- Leverages existing authentication system
- Integrates with current UI/UX patterns
- Utilizes established database connections

### External API Integration
- OpenAI API for Whisper and GPT services
- Vector database APIs for semantic search
- File storage APIs for scalable storage solutions

