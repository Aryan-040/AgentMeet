# AgentMeet - AI-Powered Meeting Assistant Platform

  
  [![Next.js](https://img.shields.io/badge/Next.js-15.3.2-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
  [![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
  [![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-38B2AC?style=for-the-badge&logo=tailwind-css)](https://tailwindcss.com/)
  [![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-316192?style=for-the-badge&logo=postgresql)](https://postgresql.org/)
</div>

## 🌟 Overview

AgentMeet is a platform that allows users to create, customize, and interact with AI agents in real-time meetings. Unlike traditional hiring platforms, AgentMeet focuses on AI agent collaboration, enabling users to have meaningful conversations with intelligent assistants for various professional and personal purposes.

### 🎯 What Makes AgentMeet Unique?

- **Custom AI Agents**: Create personalized AI agents with specific roles, expertise, and personalities
- **Real-time Collaboration**: Conduct live meetings with AI agents using advanced video/audio technology
- **Intelligent Conversations**: AI agents that can engage in contextually relevant discussions
- **Comprehensive Analytics**: Detailed transcripts, recordings, and meeting insights
- **Scalable Architecture**: Built for enterprise-grade performance and reliability

## 🚀 Real-World Applications

### 💼 Business & Professional Use Cases

#### Sales & Marketing Teams
- **Pitch Practice**: Create AI agents that simulate different client personas for sales team training
- **Market Research**: Conduct interviews with AI agents representing target demographics
- **Presentation Coaching**: Practice presentations with AI agents providing real-time feedback

#### Customer Support
- **Training Simulations**: Train support agents with AI customers presenting various scenarios
- **Escalation Practice**: Practice handling difficult customer situations with AI agents
- **Knowledge Base Testing**: Verify support documentation through AI agent interactions

#### Human Resources
- **Interview Training**: Practice interviews with AI candidates for HR professionals
- **Onboarding Simulations**: Create AI mentors for employee onboarding processes
- **Conflict Resolution Training**: Practice difficult conversations with AI scenarios

#### Consulting & Advisory
- **Client Simulation**: Practice client consultations with AI agents representing different business types
- **Strategy Discussions**: Brainstorm with AI agents specialized in specific industries
- **Risk Assessment**: Discuss potential scenarios with AI risk assessment agents

### 🎓 Educational Applications

#### Language Learning
- **Conversation Practice**: Practice with AI native speakers in multiple languages
- **Cultural Exchange**: Learn about different cultures through AI cultural ambassadors
- **Accent Training**: Improve pronunciation with AI speech coaches

#### Academic Research
- **Expert Interviews**: Conduct interviews with AI agents specialized in specific research areas
- **Peer Review Practice**: Practice academic presentations with AI peer reviewers
- **Thesis Defense Preparation**: Simulate thesis defense scenarios with AI committee members

#### Skill Development
- **Public Speaking**: Practice presentations with AI audiences providing feedback
- **Negotiation Training**: Practice negotiations with AI counterparts
- **Leadership Development**: Engage with AI leadership coaches and mentors

### 🎭 Personal Development

#### Mental Health & Wellness
- **Therapy Practice**: Practice difficult conversations with AI therapists
- **Social Skills**: Improve social interactions for individuals with social anxiety
- **Confidence Building**: Build confidence through AI interaction scenarios

#### Creative & Artistic
- **Creative Writing**: Brainstorm ideas with AI creative partners
- **Music Collaboration**: Discuss musical concepts with AI music experts
- **Art Critique**: Receive feedback from AI art critics and curators

## 🛠️ Technology Stack

### Frontend
- **Next.js 15.3.2** - React framework with App Router
- **TypeScript** - Type-safe JavaScript development
- **Tailwind CSS** - Utility-first CSS framework
- **shadcn/ui** - Modern component library
- **Lucide React** - Beautiful icon library

### Backend
- **tRPC** - End-to-end typesafe APIs
- **Drizzle ORM** - TypeScript ORM for PostgreSQL
- **Better Auth** - Modern authentication system
- **Polar** - Subscription and payment management

### AI & Real-time Communication
- **OpenAI GPT-4** - Advanced language model integration
- **Stream Video** - Real-time video calling infrastructure
- **Stream Chat** - Real-time messaging system
- **Inngest** - Background job processing

### Database & Infrastructure
- **PostgreSQL** - Primary database (Neon)
- **Neon Database** - Serverless PostgreSQL hosting
- **Vercel** - Deployment and hosting platform

## 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend       │    │   AI Services   │
│   (Next.js)     │◄──►│   (tRPC)        │◄──►│   (OpenAI)      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │              ┌─────────────────┐             │
         │              │   Database      │             │
         └──────────────►│   (PostgreSQL)  │◄────────────┘
                        └─────────────────┘
                                 │
                        ┌─────────────────┐
                        │   Real-time     │
                        │   (Stream)      │
                        └─────────────────┘
```

## 📋 Features

### 🤖 Agent Management
- Create and customize AI agents with specific roles and expertise
- Define agent personalities, knowledge areas, and conversation styles
- Manage agent permissions and access controls
- Real-time agent performance monitoring

### 💬 Meeting Experience
- High-quality video and audio calling with AI agents
- Real-time transcription and conversation analysis
- Interactive chat during meetings
- Screen sharing and collaboration tools

### 📊 Analytics & Insights
- Comprehensive meeting transcripts
- Conversation sentiment analysis
- Meeting duration and engagement metrics
- Export capabilities for reports and documentation

### 🔐 Security & Privacy
- End-to-end encryption for all communications
- GDPR-compliant data handling
- Secure authentication with multiple providers
- Role-based access control

### 💳 Subscription Management
- Flexible pricing tiers for different use cases
- Enterprise-grade features for large organizations
- Usage tracking and billing management
- Integration with payment providers

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- PostgreSQL database
- OpenAI API key
- Stream account (for video/chat)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/agentmeet.git
   cd agentmeet
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   ```
   
   Fill in your environment variables:
   ```env
   DATABASE_URL="your_postgresql_connection_string"
   OPENAI_API_KEY="your_openai_api_key"
   BETTER_AUTH_SECRET="your_auth_secret"
   BETTER_AUTH_URL="http://localhost:3000"
   NEXT_PUBLIC_STREAM_VIDEO_KEY="your_stream_video_key"
   STREAM_VIDEO_SECRET_KEY="your_stream_video_secret"
   NEXT_PUBLIC_STREAM_CHAT_API_KEY="your_stream_chat_key"
   STREAM_CHAT_SECRET_KEY="your_stream_chat_secret"
   GITHUB_CLIENT_ID="your_github_oauth_client_id"
   GITHUB_CLIENT_SECRET="your_github_oauth_secret"
   GOOGLE_CLIENT_ID="your_google_oauth_client_id"
   GOOGLE_CLIENT_SECRET="your_google_oauth_secret"
   POLAR_ACCESS_TOKEN="your_polar_access_token"
   ```

4. **Set up the database**
   ```bash
   npm run db:push
   ```

5. **Run the development server**
   ```bash
   npm run dev
   ```

6. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 📁 Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── (auth)/            # Authentication pages
│   ├── (dashboard)/       # Dashboard pages
│   └── api/               # API routes
├── components/            # Reusable UI components
│   └── ui/               # shadcn/ui components
├── modules/              # Feature modules
│   ├── agents/           # Agent management
│   ├── meetings/         # Meeting functionality
│   ├── auth/             # Authentication
│   ├── premium/          # Subscription management
│   └── dashboard/        # Dashboard components
├── lib/                  # Utility libraries
├── db/                   # Database schema and configuration
└── trpc/                 # tRPC configuration
```

## 🔧 Development

### Available Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
npm run db:push      # Push database schema changes
npm run db:studio    # Open Drizzle Studio
```

### Code Quality

- **ESLint** - Code linting and formatting
- **TypeScript** - Type safety and better developer experience
- **Prettier** - Code formatting


## 🙏 Acknowledgments

- **OpenAI** for providing the GPT-4 API
- **Stream** for real-time communication infrastructure
- **Vercel** for hosting and deployment
- **shadcn** for the beautiful UI components
- **Neon** for serverless PostgreSQL hosting







---

<div align="center">
  <strong>Built with ❤️ for the future of AI-human collaboration</strong>
  
</div>
