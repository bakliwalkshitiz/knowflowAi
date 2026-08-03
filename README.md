# 🧠 KnowFlow AI

An intelligent AI Knowledge Vault & Study Assistant built with **Spring Boot** and **React**. Upload PDFs, generate interactive flashcards, render system design architecture diagrams, and analyze study materials with AI.

🌐 **Live Application:** [https://knowflow-ai-eight.vercel.app](https://knowflow-ai-eight.vercel.app)

---

## 💡 What is KnowFlow AI?

KnowFlow AI helps students, engineers, and developers study and analyze complex documents faster. Instead of reading through hundreds of pages manually, you can upload your documents and let AI answer questions, build flashcards, design system architecture diagrams, and create study quizzes.

---

## ✨ Key Features

- **🌐 Deployed & Live:** Hosted on Vercel (Frontend) and Render (Backend + Database).
- **📄 RAG & Document Vault:** Upload PDFs/text files and ask questions directly based on document context.
- **🎴 Interactive Flashcards:** Automatically generates study flashcards (1-at-a-time pagination, side-by-side front/back view, and inline editing).
- **🏗️ System Design Mode:** Generates real-time Mermaid.js UML class diagrams (LLD) and system architecture flowcharts (HLD).
- **📊 AI Analytics Dashboard:** Visual metrics tracking usage across 7 AI modes (`Summary`, `System Design`, `Flashcards`, `Quiz`, `Interview`, `Mind Map`, `Chat`).
- **🔒 Secure Authentication:** JWT-based login authentication with automatic 24-hour expiration redirect.

---

## 🏗️ How It Works (Architecture)

```text
[ React 19 Frontend ] ──▶ [ Spring Boot 3.4 REST API ] ──▶ [ PostgreSQL + PGVector ]
       (Vite)                      (Spring Security)                 (Embeddings)
                                           │
                                           ▼
                                   [ OpenAI GPT-4o ]
```

---

## 🛠️ Tech Stack

- **Frontend:** React 19, Vite, Framer Motion, Mermaid.js, Axios, Lucide Icons
- **Backend:** Java 17/21, Spring Boot 3.4, Spring AI, Spring Security (JWT), Maven
- **Database:** PostgreSQL with `pgvector` extension

---

## 🚀 Beginner-Friendly Setup Guide (Local Running)

Follow these easy steps to run the application on your computer:

### Prerequisites
Make sure you have installed:
1. **Java 17 or 21**
2. **Node.js (v18+)**
3. **PostgreSQL Database**

---

### Step 1: Database Setup
Open your PostgreSQL terminal (or pgAdmin) and run:

```sql
CREATE DATABASE knowflow_ai;
\c knowflow_ai;
CREATE EXTENSION IF NOT EXISTS vector;
```

---

### Step 2: Start Backend (`knowflow-ai`)

1. Open a terminal and navigate to the backend folder:
   ```bash
   cd knowflow-ai
   ```

2. Create a `.env` file (or copy `.env.example`):
   ```bash
   cp .env.example .env
   ```

3. Add your database credentials and OpenAI key inside `.env`:
   ```env
   SPRING_DATASOURCE_URL=jdbc:postgresql://localhost:5432/knowflow_ai
   SPRING_DATASOURCE_USERNAME=postgres
   SPRING_DATASOURCE_PASSWORD=your_password
   OPENAI_API_KEY=your_openai_api_key
   JWT_SECRET=your_secret_key_minimum_32_characters_long
   ```

4. Build and start the backend server:
   ```bash
   mvn clean spring-boot:run
   ```
   *The backend will start at `http://localhost:8080`.*

---

### Step 3: Start Frontend (`knowflow-ui`)

1. Open a new terminal and navigate to the frontend folder:
   ```bash
   cd knowflow-ui
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```
   *The frontend will start at `http://localhost:5173`.*

---

## 🔌 Main API Endpoints

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/v1/auth/register` | Create a new user account |
| `POST` | `/api/v1/auth/login` | Login and receive JWT token |
| `POST` | `/api/v1/documents/upload` | Upload PDF or text document to Vault |
| `GET` | `/api/v1/documents` | List user documents |
| `POST` | `/api/v1/chat/send` | Send prompt to AI (Chat / Flashcard / System Design) |
| `GET` | `/api/v1/chat/history` | Get user interaction history & stats |

---

## 📄 License
This project is open-source and available under the [MIT License](LICENSE).
