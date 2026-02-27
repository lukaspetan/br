# Vortex44 - AI-Powered SaaS Builder Platform

Vortex44 is an AI-first platform that generates complete, production-ready web applications from natural language descriptions. Inspired by Base44, with enhanced capabilities.

## Features

- 🤖 **AI Code Generation** - Describe your app in plain language, get complete code
- 🔄 **Auto-Fix** - Automatic error detection and correction
- 🚀 **One-Click Deploy** - Publish apps with SSL, CDN, and global edge
- 📝 **Visual Editor** - Edit generated code with live preview
- 👥 **Multi-Tenant** - Secure isolation per user
- 🔒 **Enterprise Security** - SOC2 compliant infrastructure

## Tech Stack

### Frontend
- React 18 + Vite
- TailwindCSS
- Monaco Editor
- Zustand (state management)
- Framer Motion

### Backend
- Node.js + NestJS
- PostgreSQL
- Redis
- MinIO (S3-compatible storage)
- Socket.io

### AI Engine
- OpenAI GPT-4 API
- Custom code generation
- Auto-fix capabilities

### Infrastructure
- Docker
- Traefik (reverse proxy + SSL)
- Kubernetes-ready
- CI/CD pipelines

## Getting Started

### Prerequisites

- Node.js 20+
- Docker & Docker Compose
- PostgreSQL (or use Docker)
- Redis (or use Docker)

### Quick Start (Development)

Como Esse site foi criado

```bash
esse site foi criado pelo OpenCode
```

1. Clone the repository:
```bash
git clone https://github.com/vortex44/vortex44.git
cd vortex44
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp backend/.env.example backend/.env
# Edit .env with your configuration
```

4. Start the infrastructure:
```bash
docker-compose up -d postgres redis minio traefik
```

5. Start the development servers:
```bash
npm run dev
```

6. Open http://localhost:5173

### Production Deployment

1. Build all services:
```bash
npm run build
```

2. Deploy with Docker Compose:
```bash
docker-compose -f docker-compose.prod.yml up -d
```

## Architecture

```
┌─────────────┐
│   Frontend  │  React + Vite + Tailwind
└──────┬──────┘
       │
       ▼
┌─────────────┐
│   Backend   │  NestJS API
└──────┬──────┘
       │
   ┌───┴───┐
   ▼       ▼
┌─────┐ ┌─────┐
│ AI  │ │Deploy│
│ Eng │ │Service│
└─────┘ └─────┘
   │       │
   ▼       ▼
┌─────┐ ┌─────┐
│LLM  │ │Docker│
└─────┘ └─────┘
```

## Environment Variables

### Backend
- `DATABASE_URL` - PostgreSQL connection string
- `REDIS_URL` - Redis connection string
- `JWT_SECRET` - Secret for JWT tokens
- `MINIO_*` - MinIO/S3 configuration
- `GOOGLE_CLIENT_ID` - OAuth (optional)
- `AI_API_KEY` - OpenAI API key

### AI Engine
- `OPENAI_API_KEY` - OpenAI API key
- `ANTHROPIC_API_KEY` - Anthropic API key (optional)

### Deployer
- `DOCKER_HOST` - Docker daemon address
- `MINIO_*` - Storage configuration

## API Documentation

Once running, visit:
- API: http://localhost:3000/docs
- Traefik Dashboard: http://localhost:8080

## License

MIT
