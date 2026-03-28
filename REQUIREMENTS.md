# MedMemo — Requirements Document

> Version: 1.0Date: 2026-03-28Status: Draft

MedMemo is a multimodal AI-powered medical document management platform that helps doctors track patient documents, lab reports, prescriptions, and clinical notes, with intelligent retrieval-augmented generation (RAG) for patient insights.

## Table of Contents

1. [Railtracks ADK Requirements](#1-railtracks-adk-requirements)
2. [assistant-ui Tool-Assisted UI Requirements](#2-assistant-ui-tool-assisted-ui-requirements)
3. [Multimodal RAG Requirements](#3-multimodal-rag-requirements)
4. [Augment Code CLI Requirements](#4-augment-code-cli-requirements)
5. [Functional Requirements](#5-functional-requirements)
6. [Non-Functional Requirements](#6-non-functional-requirements)

## 1. Railtracks ADK Requirements

> Reference: Railtracks ADK | GitHub — railtownai/railtracks | Conductr Observability

Railtracks is an open-source agentic framework by Railtown AI for building and deploying autonomous AI agents, built for real-world orchestration, integration, and scale.

### 1.1 Agent Orchestration

| ID | Requirement | Priority |
| --- | --- | --- |
| RT-001 | The system SHALL use Railtracks ADK (v1.3.5+) as the primary backend agent framework for all AI workflows. | P0 |
| RT-002 | The system SHALL implement rt.function_node decorators for defining modular, reusable agent tool nodes (e.g., document ingestion, patient lookup, RAG retrieval). | P0 |
| RT-003 | The system SHALL use rt.agent_node() to compose LLM-powered agents with system prompts and tool node lists for each MedMemo capability domain. | P0 |
| RT-004 | The system SHALL support prebuilt orchestration layers for RAG, API integrations, and external service connections (e.g., EHR systems). | P1 |
| RT-005 | The system SHALL support multi-agent orchestration where specialized agents (document agent, clinical agent, prescription agent) coordinate via Railtracks pipelines. | P1 |

### 1.2 Conductr Observability

| ID | Requirement | Priority |
| --- | --- | --- |
| RT-006 | The system SHALL integrate Conductr observability platform for monitoring all AI agent executions in production. | P0 |
| RT-007 | The system SHALL expose step-by-step agent tracing via the Railtracks Agent Visualizer for debugging and quality assurance. | P1 |
| RT-008 | The system SHALL log all agent decisions, tool invocations, and LLM calls to Conductr for audit trail compliance (HIPAA). | P0 |
| RT-009 | The system SHALL track and optimize AI agent performance metrics (latency, token usage, error rates) through Conductr dashboards. | P1 |
| RT-010 | The system SHALL support real-time alerting when agent error rates exceed configurable thresholds. | P2 |

## 2. assistant-ui Tool-Assisted UI Requirements

> Reference: assistant-ui Documentation | Tools API | Generative UI

assistant-ui is a TypeScript/React library providing unstyled, accessible building blocks for AI chat interfaces, with production-ready components and comprehensive tool integration.

### 2.1 Tools() API Integration

| ID | Requirement | Priority |
| --- | --- | --- |
| AUI-001 | The system SHALL use the Tools() API (recommended) from @assistant-ui/react for centralized, type-safe tool registration — preventing duplicate registrations. | P0 |
| AUI-002 | The system SHALL define a Toolkit object containing all MedMemo tools (patient search, document retrieval, lab result lookup, prescription history). | P0 |
| AUI-003 | The system SHALL register tools via useAui({ tools: Tools({ toolkit }) }) in the runtime provider. | P0 |
| AUI-004 | The system SHALL implement Zod schemas for all tool parameter validation to ensure type safety. | P0 |
| AUI-005 | Each tool SHALL provide an execute function for frontend-executed tools and a render function for custom generative UI display. | P1 |

### 2.2 Generative UI

| ID | Requirement | Priority |
| --- | --- | --- |
| AUI-006 | The system SHALL render tool call results as interactive React components (Generative UI) — not plain text — for medical data visualization. | P0 |
| AUI-007 | The system SHALL display patient lab results, vitals, and document previews as rich, styled cards within the chat thread. | P1 |
| AUI-008 | The system SHALL use ToolFallback component as a default renderer for any tool without a custom UI. | P2 |

### 2.3 Human-in-the-Loop

| ID | Requirement | Priority |
| --- | --- | --- |
| AUI-009 | The system SHALL implement human-in-the-loop confirmation for sensitive actions (prescription changes, diagnosis suggestions, document deletions) using context.human(). | P0 |
| AUI-010 | The system SHALL render confirmation dialogs with interrupt/resume patterns, showing action details before execution. | P0 |
| AUI-011 | The system SHALL support type: "human" tool definitions for actions that always require user input before proceeding. | P1 |

### 2.4 Chat UI Components

| ID | Requirement | Priority |
| --- | --- | --- |
| AUI-012 | The system SHALL use assistant-ui primitives (Thread, Composer, Message, ActionBar) for the primary chat interface. | P0 |
| AUI-013 | The system SHALL support file attachments (PDFs, images, DICOM files) via the Attachment primitive. | P0 |
| AUI-014 | The system SHALL implement multi-agent rendering for sub-agent conversations within tool call UIs. | P2 |
| AUI-015 | The system SHALL support speech-to-text (dictation) and text-to-speech for hands-free clinical use. | P2 |
| AUI-016 | The system SHALL integrate MCP (Model Context Protocol) tools via experimental_createMCPClient for server-side tool execution. | P1 |

## 3. Multimodal RAG Requirements

> Reference: MMed-RAG (2025) — "Versatile Multimodal RAG System for Medical Vision Language Models" | awesome-multimodal-in-medical-imaging

### 3.1 Document Ingestion

| ID | Requirement | Priority |
| --- | --- | --- |
| RAG-001 | The system SHALL ingest and process multiple document formats: PDF, PNG/JPEG images, plain text, DICOM medical imaging files, and handwritten clinical notes (via OCR). | P0 |
| RAG-002 | The system SHALL extract structured metadata from ingested documents (patient ID, date, document type, provider, diagnosis codes). | P0 |
| RAG-003 | The system SHALL support batch ingestion of patient records with progress tracking and error reporting. | P1 |
| RAG-004 | The system SHALL perform automatic document classification (lab report, prescription, clinical note, imaging study) upon ingestion. | P1 |

### 3.2 Vector Embeddings & Retrieval

| ID | Requirement | Priority |
| --- | --- | --- |
| RAG-005 | The system SHALL generate multimodal vector embeddings for both text and image content using domain-specific medical embedding models. | P0 |
| RAG-006 | The system SHALL store embeddings in a vector database (e.g., pgvector, Pinecone, Weaviate) with HIPAA-compliant hosting. | P0 |
| RAG-007 | The system SHALL support cross-modal retrieval: text queries returning relevant images, and image queries returning relevant text documents. | P1 |
| RAG-008 | The system SHALL implement hybrid search combining dense vector similarity with sparse keyword matching (BM25) for optimal recall. | P1 |

### 3.3 Agentic RAG Workflows

| ID | Requirement | Priority |
| --- | --- | --- |
| RAG-009 | The system SHALL implement agentic RAG workflows using LangChain/LangGraph for multi-step reasoning over patient records. | P0 |
| RAG-010 | The system SHALL perform medical knowledge grounding by cross-referencing retrieved documents with established medical knowledge bases. | P1 |
| RAG-011 | The system SHALL provide source citations for all AI-generated insights, linking back to specific documents, pages, and highlighted passages. | P0 |
| RAG-012 | The system SHALL achieve ≥40% improvement in factual accuracy over baseline (non-RAG) models, consistent with MMed-RAG benchmarks. | P1 |
| RAG-013 | The system SHALL implement context window management to handle large patient histories without exceeding token limits. | P1 |

## 4. Augment Code CLI Requirements

> Reference: Augment Code | IDE Agents | Intent Workspace

Augment Code provides AI-powered software development with an industry-leading context engine that understands entire codebases across repository boundaries.

### 4.1 Development Workflow

| ID | Requirement | Priority |
| --- | --- | --- |
| AUG-001 | The development team SHALL use Augment Code CLI and IDE agents (VS Code / JetBrains) for all MedMemo development. | P1 |
| AUG-002 | The Context Engine SHALL be configured to index the full MedMemo monorepo for cross-file understanding during development. | P1 |
| AUG-003 | Developers SHALL use Augment Agent for multi-file editing, feature implementation, bug fixing, and code generation tasks. | P1 |
| AUG-004 | The team SHALL use Intent workspaces for agent orchestration, branch management, and collaborative development sessions. | P2 |
| AUG-005 | The team SHALL leverage parallel agents for independent subtasks (e.g., simultaneous frontend and backend implementation). | P2 |

## 5. Functional Requirements

### 5.1 Patient Document Management

| ID | Requirement | Priority |
| --- | --- | --- |
| FR-001 | The system SHALL allow authenticated users to upload patient documents (PDF, images, DICOM, text) and associate them with a patient record. | P0 |
| FR-002 | The system SHALL display a searchable, filterable patient document timeline showing all documents in chronological order. | P0 |
| FR-003 | The system SHALL support document tagging with categories (lab report, prescription, clinical note, imaging, referral). | P0 |
| FR-004 | The system SHALL provide full-text search across all ingested patient documents with relevance ranking. | P0 |
| FR-005 | The system SHALL support document versioning, retaining previous versions when documents are updated. | P1 |

### 5.2 AI-Powered Clinical Assistant

| ID | Requirement | Priority |
| --- | --- | --- |
| FR-006 | The system SHALL provide a conversational AI assistant that answers clinical questions about a patient using their complete document history. | P0 |
| FR-007 | The system SHALL generate patient summaries on demand, synthesizing information across all available documents. | P0 |
| FR-008 | The system SHALL identify and highlight potential drug interactions when prescription documents are uploaded. | P1 |
| FR-009 | The system SHALL track lab result trends over time and present them as interactive charts within the chat UI. | P1 |
| FR-010 | The system SHALL flag abnormal lab values and provide clinical context from medical knowledge bases. | P1 |

### 5.3 User Management & Access Control

| ID | Requirement | Priority |
| --- | --- | --- |
| FR-011 | The system SHALL implement role-based access control (RBAC) with roles: Admin, Physician, Nurse, Staff. | P0 |
| FR-012 | The system SHALL enforce patient-level access controls so providers only see patients assigned to them. | P0 |
| FR-013 | The system SHALL maintain a complete audit log of all document access, AI queries, and data modifications. | P0 |
| FR-014 | The system SHALL support multi-factor authentication (MFA) for all user accounts. | P0 |
| FR-015 | The system SHALL support Single Sign-On (SSO) via SAML 2.0 or OIDC for enterprise deployment. | P1 |

### 5.4 Notifications & Alerts

| ID | Requirement | Priority |
| --- | --- | --- |
| FR-016 | The system SHALL notify providers when new documents are added to their patients' records. | P1 |
| FR-017 | The system SHALL send alerts for critical lab values that require immediate clinical attention. | P1 |
| FR-018 | The system SHALL support configurable notification preferences (in-app, email, SMS). | P2 |

## 6. Non-Functional Requirements

### 6.1 Performance

| ID | Requirement | Priority |
| --- | --- | --- |
| NFR-001 | The system SHALL return AI chat responses within 3 seconds (time to first token) for 95% of queries. | P0 |
| NFR-002 | The system SHALL complete document ingestion and indexing within 30 seconds for documents up to 50 pages. | P0 |
| NFR-003 | The system SHALL support at least 100 concurrent users with no degradation in response time. | P1 |
| NFR-004 | Vector similarity search SHALL return results within 500ms for collections up to 1 million embeddings. | P1 |

### 6.2 HIPAA Compliance & Security

| ID | Requirement | Priority |
| --- | --- | --- |
| NFR-005 | The system SHALL comply with all HIPAA Privacy Rule requirements for Protected Health Information (PHI). | P0 |
| NFR-006 | The system SHALL comply with all HIPAA Security Rule requirements including Administrative, Physical, and Technical Safeguards. | P0 |
| NFR-007 | All PHI SHALL be encrypted at rest using AES-256 encryption. | P0 |
| NFR-008 | All PHI in transit SHALL be encrypted using TLS 1.3. | P0 |
| NFR-009 | The system SHALL implement automatic session timeout after 15 minutes of inactivity. | P0 |
| NFR-010 | The system SHALL maintain audit logs for a minimum of 6 years per HIPAA retention requirements. | P0 |
| NFR-011 | The system SHALL implement Business Associate Agreements (BAAs) with all third-party cloud providers handling PHI. | P0 |
| NFR-012 | The system SHALL support de-identification of patient data for analytics and model training per HIPAA Safe Harbor or Expert Determination methods. | P1 |
| NFR-013 | LLM API calls SHALL NOT transmit raw PHI to external model providers; all PHI must be processed within HIPAA-compliant infrastructure or de-identified before transmission. | P0 |
| NFR-014 | The system SHALL implement breach notification procedures compliant with the HIPAA Breach Notification Rule. | P0 |

### 6.3 Scalability & Reliability

| ID | Requirement | Priority |
| --- | --- | --- |
| NFR-015 | The system SHALL be deployable as containerized microservices (Docker/Kubernetes) for horizontal scaling. | P1 |
| NFR-016 | The system SHALL maintain 99.9% uptime (< 8.76 hours downtime per year). | P0 |
| NFR-017 | The system SHALL implement automated database backups with point-in-time recovery. | P0 |
| NFR-018 | The system SHALL support PostgreSQL with pgvector extension for unified relational + vector storage. | P1 |

### 6.4 Accessibility & Usability

| ID | Requirement | Priority |
| --- | --- | --- |
| NFR-019 | The system SHALL comply with WCAG 2.1 Level AA accessibility standards. | P1 |
| NFR-020 | The system SHALL support responsive design for desktop, tablet, and mobile viewports. | P1 |
| NFR-021 | The system SHALL support keyboard navigation for all primary workflows. | P1 |

### 6.5 Observability & Monitoring

| ID | Requirement | Priority |
| --- | --- | --- |
| NFR-022 | The system SHALL integrate Conductr for AI agent observability (see Section 1.2). | P0 |
| NFR-023 | The system SHALL expose application health metrics via standard monitoring endpoints (e.g., /health, /ready). | P1 |
| NFR-024 | The system SHALL implement structured logging (JSON format) for all services with correlation IDs for distributed tracing. | P1 |

## Appendix: Technology Stack Summary

| Layer | Technology | Purpose |
| --- | --- | --- |
| Agent Framework | Railtracks ADK v1.3.5+ | Backend agent orchestration |
| Agent Observability | Conductr by Railtown AI | Agent monitoring, tracing, debugging |
| Chat UI | assistant-ui (@assistant-ui/react) | Tool-assisted chat interface |
| RAG Pipeline | LangChain / LangGraph | Agentic RAG workflows |
| Vector Store | PostgreSQL + pgvector | Embedding storage & similarity search |
| Development | Augment Code CLI + Intent | AI-assisted development |
| Authentication | OIDC / SAML 2.0 + MFA | Identity & access management |
| Encryption | AES-256 (rest) / TLS 1.3 (transit) | HIPAA-compliant data protection |

*This document is subject to revision as the project progresses and requirements are refined.*