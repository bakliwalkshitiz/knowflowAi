# 🧠 KnowFlow AI — Intelligent Knowledge Vault & RAG Workspace

KnowFlow AI is a full-stack, enterprise-ready AI Knowledge Vault and RAG (Retrieval-Augmented Generation) application built for developers, students, and engineers. It enables users to upload PDF/text documents, perform vector-based similarity searches, generate LLD UML class diagrams & HLD system architecture flows, access 7 specialized AI tools, and customize AI execution modes.

---

## ✨ Features

- **📄 RAG & Document Storage**: Upload PDFs & text files with automatic PGVector embedding chunking and real-time statistics.
- **🏗️ LLD & HLD System Design Mode**: Generate Mermaid.js UML class diagrams (`classDiagram`) and system architecture flow charts (`graph TD`) directly inside chat.
- **🛠️ 7 Specialized AI Tools**: Integrated function calling tools for Math Calculation, Date/Time, UUID Generation, Code Structure Metrics, Text Reading Time, Unit Conversions, and Weather.
- **🔑 Dynamic User API Key Support**: Enter and store custom OpenAI API keys directly from the UI Settings page or fallback to server environment variables.
- **🎨 Sleek Modern UI**: Custom Dark Grey theme (Linear/Vercel style) and Soft Ivory light theme with responsive session management and live stats.
- **🔒 Enterprise Security**: BCrypt password hashing, stateless JWT authentication, and CORS preflight protection.

---

## 🏗️ Tech Stack

### Backend (`knowflow-ai`)
- **Framework**: Spring Boot 3.4 / Spring AI 1.0.0
- **Database**: PostgreSQL with `pgvector` extension & Spring Data JPA
- **Security**: Spring Security 6 with JWT & BCrypt
- **AI Model**: OpenAI GPT-4o-mini & `text-embedding-3-small`
- **Documentation**: SpringDoc OpenAPI / Swagger UI

### Frontend (`knowflow-ui`)
- **Framework**: React 19 + Vite 8
- **Styling**: Vanilla CSS tokens (CSS Variables) with Framer Motion animations
- **Diagrams**: Mermaid.js v11 SVG rendering
- **Icons**: Lucide React
- **HTTP Client**: Axios with Authorization interceptors

---

## 📁 Repository Structure

```text
knowflow-ai/
├── knowflow-ai/               # Spring Boot Backend Service
│   ├── src/main/java/         # Controllers, Services, Entities, AI Tools
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
| `OPENAI_API_KEY` | OpenAI API Key (Optional) | `""` |
| `JWT_SECRET` | 256-bit JWT Signing Key | Minimum 32 chars |
| `CORS_ALLOWED_ORIGINS` | Allowed Frontend URLs | `http://localhost:5173,http://localhost:3000` |

### Frontend (`knowflow-ui/.env`)
| Variable | Description | Default |
| :--- | :--- | :--- |
| `VITE_API_BASE_URL` | Backend API Endpoint | `/api/v1` (Vite Proxy) |

---

## 📖 Related Guides
- 📄 [Production Deployment Guide](DEPLOYMENT.md)
- ⚙️ [Backend README](knowflow-ai/README.md)
- 🎨 [Frontend README](knowflow-ui/README.md)
