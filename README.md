# 🧠 KnowFlow AI

**KnowFlow AI** is a full-stack AI Knowledge Vault & RAG workspace for interactive document analysis, Flashcards, System Design diagrams, and study tools.

🚀 **Live Demo:** [https://knowflow-ai-eight.vercel.app](https://knowflow-ai-eight.vercel.app)

---

## ✨ Features

- **🌐 Production Live App:** Deployed on Vercel (Frontend) & Render (Spring Boot Backend).
- **📄 RAG & Document Vault:** Vector similarity search using PostgreSQL `pgvector`.
- **🎴 Flashcards Deck:** Interactive 1-at-a-time flashcards with Front/Back cards, live counter (`1/10`), and editing.
- **🏗️ System Design Mode:** Automatic Mermaid.js LLD Class Diagrams & HLD Architecture Flowcharts.
- **📊 AI Mode Analytics:** Real-time dashboard metrics and history filtering across 7 specialized AI modes.
- **🔒 Secure Auth:** 24-hour stateless JWT token authentication with auto-redirect on expiration.

---

## 🛠️ Tech Stack

- **Frontend:** React 19, Vite, Framer Motion, Mermaid.js, Axios
- **Backend:** Spring Boot 3.4, Spring AI, Spring Security (JWT)
- **Database:** PostgreSQL + `pgvector`

---

## 🚀 Quick Start

### 1. Database Setup
```sql
CREATE DATABASE knowflow_ai;
\c knowflow_ai;
CREATE EXTENSION IF NOT EXISTS vector;
```

### 2. Backend Setup
```bash
cd knowflow-ai
cp .env.example .env
mvn clean spring-boot:run
```

### 3. Frontend Setup
```bash
cd knowflow-ui
npm install
npm run dev
```

---

## 🔗 Links
- 🚀 **Live Demo:** [https://knowflow-ai-eight.vercel.app](https://knowflow-ai-eight.vercel.app)
- 📄 [Production Deployment Guide](DEPLOYMENT.md)
