# Voiceloophr Project Summary

Voiceloophr is a modern, AI-powered HR management platform with voice interaction, calendar management, and secure authentication. It leverages Next.js, TypeScript, Tailwind CSS, and Supabase.

## Key Features:

*   **Voice-First Interface**: Includes voice queries, voice transcription, text-to-speech, and multi-language support.
*   **Smart Calendar System**: Manages HR events and interviews with real-time updates.
*   **Secure Authentication**: Utilizes Supabase for enterprise-grade authentication with Row Level Security and guest mode.
*   **AI-Powered HR Assistant**: Features AI-powered PDF parsing and summarization, intelligent candidate and document search, natural language HR queries, and context awareness.
*   **Modern UI/UX**: Responsive design, theme support (light/dark mode), draggable windows, and accessibility features.

## Relevant Existing Capabilities for Smart Parser:

*   **AI-powered PDF parsing and summarization**: Directly aligns with the user's request for summarizing various document types.
*   **Voice Transcription**: Directly aligns with the user's request for audio transcription (WAV, MP4).
*   **Intelligent candidate and document search**: Forms a basis for the RAG-based semantic search and retrieval.
*   **Context Awareness**: Can be leveraged for improving search relevance.

## Gaps to Address for Smart Parser PRD:

*   **Support for multiple file types**: While PDF is mentioned, explicit support for WAV and MP4 needs to be confirmed and expanded.
*   **Whisper integration**: The current voice transcription is mentioned, but specific integration with Whisper needs to be detailed.
*   **User control (delete/save)**: Explicit functionality for users to decide to delete or save processed files.
*   **RAG for semantic search and retrieval**: While intelligent search exists, the specific implementation of RAG for semantic search needs to be defined.
*   **Original file presentation and relevance scoring**: The requirement to present original files and their relevance score during candidate search needs to be designed.
*   **File size limitations**: The user specified keeping file sizes below 1000 lines in the architecture, which needs to be considered in the design.

