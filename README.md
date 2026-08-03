# 🧠 KnowFlow AI — Intelligent Knowledge Vault & RAG Workspace

[![Live Demo](https://img.shields.io/badge/Live%20Demo-https%3A%2F%2Fknowflow--ai--eight.vercel.app-00f2fe?style=for-the-badge&logo=vercel)](https://knowflow-ai-eight.vercel.app)
[![Build Status](https://img.shields.io/badge/Build-Passing-brightgreen?style=for-the-badge)](https://github.com/bakliwalkshitiz/knowflowAi)
[![License](https://img.shields.io/badge/License-MIT-blue?style=for-the-badge)](LICENSE)

KnowFlow AI is a full-stack, enterprise-ready AI Knowledge Vault and RAG (Retrieval-Augmented Generation) workspace built for developers, students, and engineers. It enables users to upload PDF/text documents, perform vector-based similarity searches, generate interactive Flashcard decks, render LLD UML class diagrams & HLD system architecture flows, access specialized AI execution modes, and track interaction analytics.

🚀 **Live Application:** [https://knowflow-ai-eight.vercel.app](https://knowflow-ai-eight.vercel.app)

---

## ✨ Key Features

- **🌐 Production Live Deployment**: Deployed seamlessly with Vercel (Frontend) and Render (Spring Boot + PostgreSQL PGVector Backend).
- **📄 RAG & Document Vault**: Upload PDFs & text files with automatic PGVector embedding chunking, vector similarity search, and real-time vault statistics.
- **🏗️ LLD & HLD System Design Mode**: Generate production-grade Mermaid.js UML class diagrams (`classDiagram`) and system architecture flowcharts (`graph TD`) directly inside chat.
- **🎴 Interactive Flashcards Deck**: Render interactive, 1-at-a-time flashcard decks featuring side-by-side Front/Back cards, live counter (`1/10`), inline pencil text editing, and smooth slide navigation.
- **📊 Real-time AI Mode Breakdown**: Interactive dashboard tracking execution counts across all 7 AI modes (`Summary`, `System Design`, `Flashcards`, `Quizzes`, `Interview Prep`, `Mind Maps`, `General Chat`) with mode-specific history filtering.
- **🕒 Localized Indian Timeline (IST)**: Real-time ISO date formatting adjusted for Indian Standard Time (IST UTC+5:30).
- **🔒 Enterprise Security & Auth**: BCrypt password hashing, 24-hour stateless JWT token authentication with auto-redirect to login on session expiration.

---

## 🏗️ Tech Stack

### Backend (`knowflow-ai`)
- **Framework**: Spring Boot 3.4 / Spring AI 1.0.0
- **Database**: PostgreSQL 15+ with `pgvector` extension & Spring Data JPA
- **Security**: Spring Security 6 with JWT & BCrypt
- **AI Models**: OpenAI GPT-4o-mini & `text-embedding-3-small`
- **API Documentation**: SpringDoc OpenAPI / Swagger UI

### Frontend (`knowflow-ui`)
- **Framework**: React 19 + Vite 8
- **Styling**: Vanilla CSS tokens (CSS Variables) with Framer Motion animations
- **Diagrams**: Mermaid.js v11 SVG rendering
- **Icons**: Lucide React
- **HTTP Client**: Axios with Authorization interceptors & 401/403 auto-redirects

---

## 📁 Repository Structure

```text
knowflow-ai/
├── knowflow-ai/               # Spring Boot Backend Service
│   ├── src/main/java/         # Controllers, Services, Entities, Security
│   ├── src/main/resources/    # application.yml & Database Config
│   ├── .env.example           # Backend Environment Variable Template
│   └── pom.xml                # Maven Dependencies
├── knowflow-ui/               # React + Vite Frontend App
│   ├── src/pages/             # Chat, Dashboard, Documents, History, Settings
│   ├── src/components/        # UI & Layout Components
│   ├── .env.example           # Frontend Environment Variable Template
│   └── package.json           # Frontend Dependencies
├── DEPLOYMENT.md              # Production Deployment Guide
└── README.md                  # Project Documentation
```

---

## 🚀 Quick Start (Local Setup)

### Prerequisites
- **Java 17+** (JDK 21 or 24 recommended)
- **Node.js 18+** & `npm`
- **PostgreSQL 15+** with `pgvector` extension enabled (`CREATE EXTENSION IF NOT EXISTS vector;`)

### 1. Database Setup
```sql
CREATE DATABASE knowflow_ai;
\c knowflow_ai;
CREATE EXTENSION IF NOT EXISTS vector;
```

### 2. Backend Setup (`knowflow-ai`)
```bash
cd knowflow-ai

# Copy environment template
cp .env.example .env

# Build and run
mvn clean spring-boot:run
```
Backend will start on `http://localhost:8080`. Swagger documentation available at `http://localhost:8080/swagger-ui.html`.

### 3. Frontend Setup (`knowflow-ui`)
```bash
cd knowflow-ui

# Install dependencies
npm install

# Copy environment template
cp .env.example .env

# Run development server
npm run dev
```
Frontend will start on `http://localhost:5173`.

---

## ⚙️ Environment Variables

### Backend (`knowflow-ai/.env`)
| Variable | Description | Default |
| :--- | :--- | :--- |
| `SPRING_DATASOURCE_URL` | PostgreSQL JDBC Connection URL | `jdbc:postgresql://localhost:5432/knowflow_ai` |
| `SPRING_DATASOURCE_USERNAME` | Database User | `postgres` |
| `SPRING_DATASOURCE_PASSWORD` | Database Password | `postgres` |
| `OPENAI_API_KEY` | OpenAI API Key | `""` |
| `JWT_SECRET` | 256-bit JWT Signing Key | Minimum 32 chars |
| `CORS_ALLOWED_ORIGINS` | Allowed Frontend URLs | `http://localhost:5173,http://localhost:3000,https://knowflow-ai-eight.vercel.app` |

### Frontend (`knowflow-ui/.env`)
| Variable | Description | Default |
| :--- | :--- | :--- |
| `VITE_API_BASE_URL` | Backend API Endpoint | `/api/v1` (Vite Proxy / Production URL) |

---

## 📖 Related Documentation
- 🚀 **Live Web Application:** [https://knowflow-ai-eight.vercel.app](https://knowflow-ai-eight.vercel.app)
- 📄 [Production Deployment Guide](DEPLOYMENT.md)
- ⚙️ [Backend Documentation](knowflow-ai/README.md)
- 🎨 [Frontend Documentation](knowflow-ui/README.md)

---

## 📄 License
This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
