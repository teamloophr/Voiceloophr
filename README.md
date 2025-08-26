# VoiceLoopHR 🎤📅🔐

A modern, AI-powered HR management platform with voice interaction, calendar management, and secure authentication - all accessible through intuitive modal windows.

![VoiceLoopHR](https://img.shields.io/badge/Next.js-15.5.0-black?style=for-the-badge&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=for-the-badge&logo=typescript)
![Supabase](https://img.shields.io/badge/Supabase-8.0-green?style=for-the-badge&logo=supabase)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.0-38B2AC?style=for-the-badge&logo=tailwind-css)

## ✨ Features

### 🎤 Voice-First Interface
- **Voice Queries**: Ask HR questions naturally using speech
- **Voice Transcription**: Convert voice to text for document processing
- **Text-to-Speech**: Built-in accessibility with customizable playback controls
- **Multi-language Support**: International voice recognition capabilities

### 📅 Smart Calendar System
- **Modal Windows**: Calendar opens as draggable windows, not separate pages
- **Event Management**: Create, edit, and manage HR events and interviews
- **Interview Scheduler**: Dedicated interface for scheduling candidate interviews
- **Real-time Updates**: Live calendar synchronization across the platform

### 🔐 Secure Authentication
- **Supabase Integration**: Enterprise-grade authentication with Row Level Security
- **Guest Mode**: Development and testing without authentication barriers
- **Modal Interface**: Sign-in/sign-up through elegant popup windows
- **Theme-Aware**: Automatic light/dark mode detection and switching

### 🤖 AI-Powered HR Assistant
- **Document Analysis**: AI-powered PDF parsing and summarization
- **Smart Search**: Intelligent candidate and document search
- **Voice Interaction**: Natural language HR queries and responses
- **Context Awareness**: Remembers conversation history and user preferences

### 🎨 Modern UI/UX
- **Responsive Design**: Works seamlessly on all device sizes
- **Theme Support**: Automatic light/dark mode with true black backgrounds
- **Draggable Windows**: Intuitive modal system for all major functions
- **Accessibility**: Screen reader support and keyboard navigation

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- pnpm (recommended) or npm
- Supabase account

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/voiceloophr.git
   cd voiceloophr
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   # or
   npm install
   ```

3. **Environment Setup**
   ```bash
   cp env.example .env.local
   ```
   
   Update `.env.local` with your Supabase credentials:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   ```

4. **Database Setup**
   ```bash
   # Run the SQL scripts in your Supabase SQL editor
   # scripts/01-create-tables.sql
   # scripts/02-hr-documents-table.sql
   # scripts/03-user-settings-table.sql
   # scripts/04-calendar-rls.sql
   ```

5. **Start Development Server**
   ```bash
   pnpm dev
   # or
   npm run dev
   ```

6. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 🏗️ Architecture

### Frontend
- **Next.js 15**: React framework with App Router
- **TypeScript**: Type-safe development
- **Tailwind CSS**: Utility-first styling
- **Shadcn UI**: Modern component library
- **Three.js**: Interactive background animations

### Backend
- **Next.js API Routes**: Serverless API endpoints
- **Supabase**: Database, authentication, and real-time features
- **PostgreSQL**: Relational database with RLS policies
- **Row Level Security**: Data isolation and user privacy

### Key Components
- **Enhanced Chat Interface**: Main application hub
- **Calendar Modal**: Draggable calendar window
- **Auth Modal**: Authentication interface
- **Voice Recorder**: Speech input and processing
- **Document Manager**: File upload and analysis

## 🎯 Usage

### Voice Commands
- **"Open calendar"** → Opens calendar modal
- **"Schedule interview"** → Opens interview scheduler
- **"Sign in"** → Opens authentication modal
- **"Analyze document"** → Opens document upload

### Keyboard Shortcuts
- **Alt + C** → Open calendar
- **Alt + A** → Open authentication
- **Alt + S** → Open settings
- **Escape** → Close any modal

### Modal Navigation
- **Drag and Drop**: All modals are draggable windows
- **Click Outside**: Click backdrop to close modals
- **Responsive**: Modals adapt to screen size automatically

## 🔧 Configuration

### Voice Settings
- **Speech Rate**: Adjust text-to-speech speed
- **Volume Control**: Integrated with system audio
- **Language**: Support for multiple languages
- **Voice Selection**: Choose from available system voices

### Theme Configuration
- **Auto-detect**: Automatic light/dark mode switching
- **Manual Override**: Force specific theme
- **True Black**: Dark mode uses pure black backgrounds
- **Custom Colors**: Extensible color system

## 📁 Project Structure

```
voiceloophr/
├── app/                    # Next.js App Router
│   ├── api/               # API endpoints
│   ├── ai-assistant/      # AI chat interface
│   ├── calendar/          # Calendar pages
│   ├── documents/         # Document management
│   └── voice/             # Voice interface
├── components/             # React components
│   ├── ai/                # AI assistant components
│   ├── auth/              # Authentication components
│   ├── calendar/          # Calendar components
│   ├── chat/              # Chat interface
│   ├── documents/         # Document components
│   ├── voice/             # Voice components
│   └── ui/                # Reusable UI components
├── contexts/               # React contexts
├── lib/                    # Utility functions
├── scripts/                # Database setup scripts
├── types/                  # TypeScript type definitions
└── public/                 # Static assets
```

## 🧪 Development

### Available Scripts
```bash
pnpm dev          # Start development server
pnpm build        # Build for production
pnpm start        # Start production server
pnpm lint         # Run ESLint
pnpm type-check   # Run TypeScript compiler
```

### Code Quality
- **ESLint**: Code linting and formatting
- **TypeScript**: Static type checking
- **Prettier**: Code formatting (via ESLint)
- **Husky**: Git hooks for quality assurance

## 🚀 Deployment

### Current Status and Known Challenges

We recently introduced hybrid semantic search with chunking, audit logs, and stricter auth.

- Search requires valid OpenAI key server-side and a real Supabase user UUID (guest mode is not supported for vector RPCs). If embeddings fail, the API falls back to text search.
- New SQL scripts to run in this order: `02-hr-documents-table.sql`, `05-search-admin.sql`, `06-search-hybrid-and-candidates.sql`, `07-embeddings-maintenance.sql`, `08-security-audit-and-chunks.sql`.
- Ensure Supabase Auth Email is enabled and Redirect URLs include your app URL.

See `docs/KNOWN_ISSUES.md` for step-by-step fixes.

### Vercel (Recommended)
1. Connect your GitHub repository to Vercel
2. Set environment variables in Vercel dashboard
3. Deploy automatically on push to main branch

### Other Platforms
- **Netlify**: Static site generation
- **Railway**: Full-stack deployment
- **Docker**: Containerized deployment

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines
- Follow TypeScript best practices
- Use conventional commit messages
- Ensure all tests pass
- Update documentation for new features

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Supabase** for backend infrastructure
- **Next.js** for the React framework
- **Tailwind CSS** for styling utilities
- **Shadcn UI** for component library
- **Three.js** for 3D animations

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/yourusername/voiceloophr/issues)
- **Discussions**: [GitHub Discussions](https://github.com/yourusername/voiceloophr/discussions)
- **Documentation**: [Wiki](https://github.com/yourusername/voiceloophr/wiki)

---

**Built with ❤️ for modern HR teams**