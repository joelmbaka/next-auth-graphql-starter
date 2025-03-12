# GeniusGPT Assistant

A Next.js application that uses AI to interact with Google services (Gmail and Calendar) through natural language commands.

## Features

- **Gmail Integration**
  - Search emails with natural language queries
  - Read specific emails by message ID
  - Create draft emails
  - View email threads
  - Send emails (creates drafts for safety)

- **Calendar Integration**
  - Create new calendar events
  - View your calendar schedule
  - Natural language interpretation of dates and times

- **AI-Powered Understanding**
  - Uses NVIDIA's LLaMA 3.3 70B model for intent detection
  - Converts natural language to structured API calls
  - Formats API responses into human-friendly text

## Technology Stack

- **Frontend**: Next.js, React, TypeScript
- **Authentication**: NextAuth.js with Google OAuth
- **Database**: Neo4j (via Neo4j Adapter)
- **AI**: NVIDIA API with LLaMA 3.3 70B
- **APIs**: Google Gmail API, Google Calendar API
- **Tools**: LangChain integration tools

## Setup

### Prerequisites

- Node.js and npm
- Google Cloud Platform account with Gmail and Calendar APIs enabled
- NVIDIA API access
- Neo4j database

### Environment Variables

NEXTAUTH_URL=http://localhost:3000
