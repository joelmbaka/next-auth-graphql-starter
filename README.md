# AI Conversationalist App Template

A Next.js application template for building AI-powered conversational interfaces that integrate with various services (Gmail, Calendar, etc.) using natural language commands.

## Features

- **Natural Language Processing**
  - Intent detection using NVIDIA's LLaMA 3.3 70B model
  - Context-aware responses
  - Structured data extraction from natural language

- **Service Integrations**
  - Gmail API integration
    - Search emails
    - Read specific emails
    - Create draft emails
    - View email threads
  - Google Calendar integration
    - Create events
    - View schedule
    - Natural date/time parsing
  - Google Contacts integration
    - Search contacts
    - Create new contacts
    - View contact details

- **Authentication & Security**
  - NextAuth.js v5 with Edge compatibility
  - JWT-based session management
  - OAuth2 for Google services
  - Neo4j adapter for user data persistence

## Technology Stack

- **Frontend**
  - Next.js 14 (App Router)
  - React
  - TypeScript
  - Tailwind CSS

- **Backend**
  - Next.js API Routes
  - Edge Runtime support
  - Neo4j Database

- **Authentication**
  - NextAuth.js v5
  - JWT strategy
  - Google OAuth2
  - GitHub OAuth2

- **AI/ML**
  - NVIDIA API
  - LLaMA 3.3 70B model
  - LangChain integration

- **APIs**
  - Google Gmail API
  - Google Calendar API
  - Google People API
  - NVIDIA API

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm (recommended) or npm
- Google Cloud Platform account
- NVIDIA API access
- Neo4j database

### Environment Setup

1. Clone the repository:
```bash
git clone <repository-url>
cd ai-conversationalist
```

2. Install dependencies:
```bash
pnpm install
```

3. Set up environment variables:
```env
# Authentication
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key

# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# GitHub OAuth
GITHUB_ID=your-github-client-id
GITHUB_SECRET=your-github-client-secret

# Neo4j
NEO4J_URI=your-neo4j-uri
NEO4J_USERNAME=your-username
NEO4J_PASSWORD=your-password

# NVIDIA API
NVIDIA_API_KEY=your-nvidia-api-key
```

### Project Structure

```
├── app/
│   ├── api/
│   │   ├── (agents)/      # AI agent endpoints
│   │   ├── auth/          # Auth endpoints
│   │   └── graphql/       # GraphQL API
│   ├── dashboard/         # Protected dashboard
│   └── layout.tsx         # Root layout
├── lib/
│   ├── clients/          # API clients
│   └── tools/            # AI tools
├── auth.config.ts        # Auth configuration
├── auth.ts              # Auth setup
└── middleware.ts        # Route protection
```

### Key Components

1. **Authentication Setup**
   - Edge-compatible auth configuration
   - JWT session handling
   - Protected routes

2. **AI Integration**
   - NVIDIA LLM setup
   - Intent detection
   - Natural language processing

3. **Service Integrations**
   - Google API setup
   - OAuth2 configuration
   - API route handlers

### Development

1. Start the development server:
```bash
pnpm dev
```

2. Access the application:
```
http://localhost:3000
```

### Deployment

1. Build the application:
```bash
pnpm build
```

2. Start the production server:
```bash
pnpm start
```

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

MIT License - see LICENSE file for details

## Acknowledgments

- Next.js team for the App Router
- Auth.js team for NextAuth v5
- NVIDIA for the LLaMA model
- Google Cloud Platform
- Neo4j team
