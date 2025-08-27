# VoiceLoopHR - AI-Powered HR Assistant

VoiceLoopHR is a modern, AI-powered Human Resources assistant that combines document analysis, voice recognition, and intelligent search capabilities to streamline HR workflows.

## 🚀 Features

### Core Functionality
- **AI-Powered Document Analysis** - Upload and analyze resumes, documents, and images
- **Voice Recognition & Transcription** - Speak to interact with the system naturally
- **Text-to-Speech** - Listen to AI responses with adjustable volume control
- **Semantic Search** - Find relevant documents and candidates using AI-powered search
- **Calendar Integration** - Schedule interviews and manage HR events
- **Candidate Management** - Organize and track candidate profiles and documents

### Technical Features
- **Multi-format Support** - PDF, DOCX, images, audio, video, and more
- **Real-time Processing** - Instant document analysis and transcription
- **Responsive Design** - Optimized for desktop and mobile devices
- **Dark/Light Theme** - Customizable interface with modern design
- **Glassmorphism UI** - Beautiful, modern interface with backdrop blur effects
- **Drag & Drop** - Intuitive file handling and message organization

### AI Capabilities
- **OpenAI Integration** - Powered by GPT models for intelligent responses
- **ElevenLabs Voice** - High-quality text-to-speech with multiple voices
- **OCR Processing** - Extract text from images and scanned documents
- **Document Summarization** - AI-powered document analysis and key point extraction
- **Semantic Search** - Find relevant content using natural language queries

## 🛠️ Technology Stack

- **Frontend**: Next.js 14, React 18, TypeScript
- **Styling**: Tailwind CSS, CSS-in-JS
- **AI Services**: OpenAI API, ElevenLabs API
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **File Storage**: Supabase Storage
- **Deployment**: Vercel, AWS Amplify

## 📱 Mobile Optimization

Recent updates include comprehensive mobile optimization:
- **Responsive Navbar** - Adapts to mobile screen sizes
- **Touch-friendly Controls** - Optimized for mobile interaction
- **Mobile-first Design** - Ensures great experience on all devices
- **Voice Permissions** - Enhanced mobile microphone handling
- **Responsive Layout** - Adapts to portrait and landscape orientations

## 🎨 Design System

VoiceLoopHR features a modern, consistent design system:
- **Thin Lines & Typography** - Clean, professional appearance
- **Glassmorphism Effects** - Modern backdrop blur and transparency
- **Dynamic Themes** - Seamless light/dark mode switching
- **Consistent Components** - Unified design language across all interfaces
- **Custom Color Schemes** - User-configurable accent colors

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- pnpm (recommended) or npm
- Supabase account
- OpenAI API key (optional but recommended)
- ElevenLabs API key (optional for enhanced voice)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/voiceloophr.git
   cd voiceloophr
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   ```

3. **Environment Setup**
   ```bash
   cp env.example .env.local
   ```
   
   Fill in your environment variables:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   OPENAI_API_KEY=your_openai_key
   ELEVENLABS_API_KEY=your_elevenlabs_key
   ```

4. **Database Setup**
   ```bash
   # Run the SQL scripts in the scripts/ directory
   # Start with 01-create-tables.sql and work through them
   ```

5. **Start Development Server**
   ```bash
   pnpm run dev
   ```

6. **Open your browser**
   Navigate to `http://localhost:3000`

## 🔧 Configuration

### API Keys
- **OpenAI**: Required for AI responses and document analysis
- **ElevenLabs**: Optional for enhanced text-to-speech voices
- **Supabase**: Required for database and authentication

### Voice Settings
- **Volume Control**: Adjustable from 0-100% with real-time updates
- **Voice Selection**: Choose between browser TTS and ElevenLabs voices
- **Playback Controls**: Play, pause, rewind, and fast-forward audio

### Theme Customization
- **Dark/Light Mode**: Automatic theme switching
- **Custom Colors**: User-configurable accent and background colors
- **Visual Effects**: Adjustable particle animations and wave effects

## 📁 Project Structure

```
voiceloophr/
├── app/                    # Next.js app directory
│   ├── api/               # API routes
│   ├── globals.css        # Global styles
│   └── page.tsx           # Main page
├── components/             # React components
│   ├── ai/                # AI-related components
│   ├── auth/              # Authentication components
│   ├── calendar/          # Calendar components
│   ├── chat/              # Chat interface
│   ├── documents/         # Document handling
│   └── ui/                # UI components
├── lib/                   # Utility libraries
│   ├── ai-processing.ts   # AI processing logic
│   ├── voice-utils.ts     # Voice recognition & synthesis
│   └── supabase.ts        # Database client
├── scripts/               # Database setup scripts
└── types/                 # TypeScript type definitions
```

## 🔐 Authentication

VoiceLoopHR supports multiple authentication methods:
- **Email/Password**: Traditional sign-up and sign-in
- **Guest Mode**: Limited functionality without authentication
- **Social Login**: OAuth providers (configurable)
- **Session Management**: Secure, persistent sessions

## 📊 Database Schema

The application uses a comprehensive database schema:
- **Users**: Authentication and user preferences
- **Documents**: File storage and metadata
- **Candidates**: Candidate profiles and information
- **Embeddings**: Vector storage for semantic search
- **Audit Logs**: Security and usage tracking

## 🚀 Deployment

### Vercel (Recommended)
1. Connect your GitHub repository
2. Configure environment variables
3. Deploy automatically on push

### AWS Amplify
1. Connect your repository
2. Configure build settings
3. Set environment variables

### Manual Deployment
1. Build the application: `pnpm run build`
2. Start production server: `pnpm start`

## 🧪 Testing

```bash
# Run tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Run tests with coverage
pnpm test:coverage
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Make your changes
4. Commit your changes: `git commit -m 'Add feature'`
5. Push to the branch: `git push origin feature-name`
6. Submit a pull request

## 📝 Recent Updates

### v2.0.0 - Mobile Optimization & Design System
- ✨ Complete mobile responsiveness overhaul
- 🎨 New design system with glassmorphism effects
- 🔊 Enhanced volume control with real-time updates
- 🌙 Improved dark/light theme switching
- 📱 Mobile-optimized navigation and controls
- 🎯 Consistent styling across all components

### v1.5.0 - Voice & AI Enhancements
- 🎤 Improved voice recognition for mobile devices
- 🤖 Enhanced AI document analysis
- 🔍 Better semantic search capabilities
- 📄 Support for more file formats
- 🎵 ElevenLabs voice integration

## 🐛 Known Issues

See [KNOWN_ISSUES.md](docs/KNOWN_ISSUES.md) for current issues and workarounds.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- OpenAI for AI capabilities
- ElevenLabs for voice synthesis
- Supabase for backend services
- Next.js team for the amazing framework
- All contributors and users

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/yourusername/voiceloophr/issues)
- **Discussions**: [GitHub Discussions](https://github.com/yourusername/voiceloophr/discussions)
- **Documentation**: [Wiki](https://github.com/yourusername/voiceloophr/wiki)

---

**VoiceLoopHR** - Transforming HR workflows with AI-powered intelligence 🚀
