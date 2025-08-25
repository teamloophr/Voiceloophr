# Developer Instructions: VoiceLoopHR

## 1. Introduction

This document provides technical instructions for developers working on the VoiceLoopHR application. It covers environment setup, component integration, and implementation details for key features.

## 2. Project Setup

### 2.1. Prerequisites

*   Node.js (LTS version)
*   npm or pnpm
*   Git
*   Access to Supabase project
*   OpenAI API key

### 2.2. Clone Repository

```bash
git clone https://github.com/teamloophr/Voiceloophr.git
cd Voiceloophr
```

### 2.3. Install Dependencies

```bash
pnpm install
```

### 2.4. Environment Variables

Create a `.env.local` file in the root directory and add the following:

```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
OPENAI_API_KEY=your_openai_api_key
```

## 3. Frontend Development

### 3.1. Project Structure

The project follows a shadcn-like structure. Components are primarily located in `components/ui`.

### 3.2. Wave Animation Background

The `wave-animation-1.tsx` component is used for the dynamic background. Ensure it is located in `components/ui/wave-animation-1.tsx`.

**Dependencies:**

Install `three.js`:

```bash
pnpm install three
```

**Integration:**

To use the `WaveAnimation` component, import it and place it in your layout. For example, in `app/layout.tsx` or a similar top-level component:

```tsx
import { WaveAnimation } from "@/components/ui/wave-animation-1";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <WaveAnimation className="absolute inset-0 z-0" />
        <div className="relative z-10">
          {children}
        </div>
      </body>
    </html>
  );
}
```

Adjust `width`, `height`, `waveSpeed`, `waveIntensity`, `particleColor`, `pointSize`, and `gridDistance` props as needed for desired visual effects. For white and black mode, dynamically change `particleColor` based on the theme.

### 3.3. Light/Dark Mode Toggle

Implement a toggle mechanism (e.g., using `next-themes` or a custom context) to switch between light and dark themes. The `particleColor` prop of `WaveAnimation` should be updated accordingly.

### 3.4. Navigation Bar

Create a navigation bar component. Include:

*   Light/Dark mode toggle.
*   Gear icon (settings) - use `lucide-react` for icons (e.g., `<Settings />`).

### 3.5. Visual Elements

*   **Calendar Icon:** Use `lucide-react` for a calendar icon (e.g., `<Calendar />`). Position it with a background element to simulate a calendar behind it.
*   **Person Icon:** Use `lucide-react` for a person icon (e.g., `<User />`). This will link to the user profile card or database entry candidate profile.

## 4. Backend Development

### 4.1. Supabase Integration (RAG and Document Storage)

Configure Supabase client for database interactions. Implement functions for:

*   **Resume Upload:** Store hard copies of resumes and other documents.
*   **Semantic Search:** Utilize Supabase vector embeddings for RAG-based semantic search on uploaded resumes. This will involve:
    *   Extracting text from resumes.
    *   Generating embeddings for the text (e.g., using OpenAI embeddings API).
    *   Storing embeddings in a Supabase vector column.
    *   Performing similarity searches based on natural language queries.

### 4.2. OpenAI Integration (Transcription and Summarization)

Use the OpenAI API for:

*   **Voice Transcription (Whisper):** Send audio files to the Whisper API for transcription.
*   **Document Summarization:** Send transcribed text or uploaded document content to OpenAI's language models for summarization.
*   **Text-to-Speech:** Convert summarized content back to speech for spoken output.

### 4.3. Model Context Protocol Calendar Integration

Research and implement Model Context Protocol protocol clients to connect to various calendar services. This will likely involve:

*   OAuth 2.0 for authentication with calendar providers.
*   API calls to create, read, update, and delete calendar events.
*   Voice command parsing to translate user commands into calendar actions.

## 5. Implementation Guidelines

*   **Modularity:** Keep components and functions modular and reusable.
*   **Error Handling:** Implement robust error handling for API calls and data processing.
*   **Security:** Ensure all API keys and sensitive data are handled securely (e.g., server-side processing for OpenAI API calls).
*   **Performance:** Optimize for performance, especially for real-time transcription and summarization.
*   **Testing:** Write unit and integration tests for all major features.

## 6. Future Work

*   Detailed API specifications for calendar integrations.
*   Scalability testing and optimization.
*   Comprehensive security audit.
*   Deployment automation.



