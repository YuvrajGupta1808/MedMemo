# 🩺 MedMemo

**AI-Powered Multimodal Medical Document Management for Doctors**

![AI Multimodal](https://img.shields.io/badge/AI-Multimodal-blueviolet?style=for-the-badge)

![HIPAA Compliant](https://img.shields.io/badge/HIPAA-Compliant-green?style=for-the-badge)

![Railtracks ADK](https://img.shields.io/badge/Agents-Railtracks_ADK-blue?style=for-the-badge)

![assistant-ui](https://img.shields.io/badge/UI-assistant--ui-orange?style=for-the-badge)

![License MIT](https://img.shields.io/badge/License-MIT-yellow?style=for-the-badge)

[Getting Started](#getting-started) • [Architecture](#architecture) • [Tech Stack](#tech-stack) • [Deployment](#deployment) • [Contributing](#contributing)

## Overview

**MedMemo** is an AI-powered multimodal medical document management platform designed for doctors and healthcare professionals. It streamlines how clinicians track patient documents, lab reports, prescriptions, and clinical notes — with intelligent retrieval-augmented generation (RAG) for instant patient insights and decision support.

Built with [**Railtracks ADK**](https://railtracks.org/) for agentic orchestration, [**assistant-ui**](https://www.assistant-ui.com/) for tool-assisted conversational UI, and [**Augment Code CLI**](https://www.augmentcode.com/) for AI-assisted development.

## Features

| Feature | Description |
|---------|-------------|
| **📄 Patient Document Management** | Organize and manage lab reports, prescriptions, imaging results, clinical notes, and referral letters per patient |
| **🧠 RAG-Based Patient Insights** | Retrieval-augmented generation surfaces relevant patient history, drug interactions, and clinical context from the document corpus |
| **🎙️ Multimodal Input/Output** | Accept and process text, images (scans, X-rays), PDFs, and voice dictation for hands-free clinical workflows |
| **🛠️ Tool-Assisted AI Chat** | Streaming AI responses with interactive tool calls rendered as rich UI components via assistant-ui's generative UI |
| **🔒 HIPAA-Compliant Architecture** | End-to-end encryption, audit logging, role-based access control, and data residency controls for protected health information (PHI) |
| **🤖 Agentic Workflows** | Autonomous AI agents built with Railtracks ADK handle document classification, summarization, and cross-referencing |
| **📊 Clinical Dashboard** | At-a-glance patient summaries, recent activity, pending reviews, and AI-generated alerts |
| **🔍 Semantic Search** | Vector-powered search across all patient documents with natural language queries |

## Tech Stack

| Layer | Technology | Description |
|-------|-----------|-------------|
| **Frontend** | [assistant-ui](https://www.assistant-ui.com/) | Tool-assisted AI chat interface with generative UI, streaming responses, and the `Tools()` API for interactive tool rendering |
| **Frontend Framework** | React / Next.js | Server-side rendering, routing, and API routes |
| **Backend Agents** | [Railtracks ADK](https://railtracks.org/) | Open-source agentic framework by Railtown AI for building and deploying autonomous AI agents with prebuilt orchestration layers |
| **Observability** | [Conductr](https://railtown.ai/) | Agent observability and application productivity platform by Railtown AI for full visibility into AI deployments and runs |
| **Database** | PostgreSQL | Relational data storage for patient records, users, and metadata |
| **Vector Store** | pgvector / Pinecone | Embedding storage for RAG-based semantic search and retrieval |
| **AI Models** | Multimodal LLMs (GPT-4o, Claude, etc.) | Document understanding, summarization, and conversational AI |
| **Auth** | NextAuth.js / Auth0 | Authentication and role-based access control |
| **Development** | [Augment Code CLI](https://www.augmentcode.com/) | AI-assisted development tool used to build MedMemo |

---

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Frontend (Next.js)                    │
│  ┌─────────────────────────────────────────────────┐    │
│  │       assistant-ui (@assistant-ui/react)         │    │
│  │  • Tool-assisted chat with generative UI        │    │
│  │  • Streaming AI responses                       │    │
│  │  • Interactive tool call rendering (Tools() API)│    │
│  └──────────────────────┬──────────────────────────┘    │
│                         │                               │
│  ┌──────────────┐  ┌────┴─────┐  ┌──────────────────┐  │
│  │  Dashboard   │  │API Routes│  │ Document Viewer   │  │
│  └──────────────┘  └────┬─────┘  └──────────────────┘  │
└─────────────────────────┼───────────────────────────────┘
                          │
┌─────────────────────────┼───────────────────────────────┐
│              Backend Agent Layer                        │
│  ┌──────────────────────┴──────────────────────────┐    │
│  │      Railtracks ADK (Agent Orchestration)       │    │
│  │  • Document Classification Agent               │    │
│  │  • Summarization Agent                          │    │
│  │  • RAG Retrieval Agent                          │    │
│  │  • Clinical Insight Agent                       │    │
│  └──────┬───────────┬──────────────┬───────────────┘    │
│         │           │              │                    │
│  ┌──────┴──┐  ┌─────┴─────┐  ┌────┴──────┐            │
│  │ LLM API │  │ RAG Engine│  │ Tool Nodes│            │
│  └─────────┘  └─────┬─────┘  └───────────┘            │
│                     │                                   │
│        ┌───────────┴───────────┐                       │
│        │  Conductr (Observ.)   │                       │
│        │  Agent monitoring &   │                       │
│        │  run tracing          │                       │
│        └───────────────────────┘                       │
└─────────────────────────────────────────────────────────┘
                          │
┌─────────────────────────┼───────────────────────────────┐
│                    Data Layer                           │
│  ┌──────────┐  ┌────────┴───┐  ┌─────────────────┐    │
│  │PostgreSQL│  │Vector Store│  │ Object Storage   │    │
│  │(patients,│  │(embeddings │  │ (PDFs, images,   │    │
│  │ records) │  │ for RAG)   │  │  documents)      │    │
│  └──────────┘  └────────────┘  └─────────────────┘    │
└─────────────────────────────────────────────────────────┘
```

## Getting Started

### Prerequisites

- **Node.js** ≥ 18.x
- **Python** ≥ 3.10 (for Railtracks ADK agents)
- **PostgreSQL** ≥ 15
- **pnpm** (recommended) or npm

### Installation

```bash
# Clone the repository
git clone https://github.com/your-org/medmemo.git
cd medmemo

# Install frontend dependencies
pnpm install

# Install Railtracks ADK (Python agent layer)
pip install railtracks

# Set up environment variables
cp .env.example .env.local
```

### Environment Variables

```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/medmemo

# AI / LLM
OPENAI_API_KEY=sk-...
# or ANTHROPIC_API_KEY=sk-ant-...

# Vector Store
VECTOR_STORE_URL=your-vector-store-url

# Auth
NEXTAUTH_SECRET=your-secret
NEXTAUTH_URL=http://localhost:3000

# Conductr (Observability)
CONDUCTR_API_KEY=your-conductr-key
```

### Running Locally

```bash
# Start the database
docker compose up -d postgres

# Run database migrations
pnpm db:migrate

# Start the Railtracks agent server
python -m medmemo.agents.server

# Start the Next.js development server
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) to access MedMemo.

---

## Deployment

### Docker

```bash
docker compose up -d
```

### Cloud Deployment

MedMemo can be deployed to any cloud platform that supports Node.js and Python:

1. **Vercel** — Frontend (Next.js)
2. **Cloud Run / ECS** — Railtracks agent backend
3. **Managed PostgreSQL** — Database (e.g., Supabase, Neon, AWS RDS)
4. **Conductr Cloud** — Agent observability dashboard

Ensure all environment variables are configured in your deployment platform and that HIPAA-compliant infrastructure is used for production deployments handling PHI.

---

## Contributing

We welcome contributions! Please follow these steps:

1. **Fork** the repository
2. **Create** a feature branch (`git checkout -b feature/my-feature`)
3. **Commit** your changes (`git commit -m 'Add my feature'`)
4. **Push** to the branch (`git push origin feature/my-feature`)
5. **Open** a Pull Request

### Development Guidelines

- Follow existing code patterns and conventions
- Write tests for new features
- Ensure HIPAA compliance for any changes touching patient data
- Use [Augment Code CLI](https://www.augmentcode.com/) for AI-assisted development

---

## License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.

Built with ❤️ using [Railtracks ADK](https://railtracks.org/) · [assistant-ui](https://www.assistant-ui.com/) · [Conductr](https://railtown.ai/) · [Augment Code CLI](https://www.augmentcode.com/)