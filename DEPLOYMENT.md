# 🚢 KnowFlow AI — Production Deployment Guide

This guide outlines step-by-step instructions for deploying KnowFlow AI to production cloud environments (e.g. Render, Railway, AWS, Vercel, Netlify, Docker).

---

## 📋 Pre-Deployment Checklist

- [x] Secrets removed from source control (`.env` files ignored).
- [x] CORS allowed origins configured (`CORS_ALLOWED_ORIGINS`).
- [x] Database `show-sql` disabled (`SPRING_JPA_SHOW_SQL=false`).
- [x] Frontend API base URL configured (`VITE_API_BASE_URL`).
- [x] Vector extension enabled in PostgreSQL (`CREATE EXTENSION IF NOT EXISTS vector;`).

---

## 🗄️ 1. Database Deployment (PostgreSQL + PGVector)

Deploy PostgreSQL on Managed Database providers supporting `pgvector` (e.g., **Supabase**, **Neon.tech**, **AWS RDS**, **Render PostgreSQL**):

1. Provision PostgreSQL 15+ database instance.
2. Run database initialization script:
   ```sql
   CREATE EXTENSION IF NOT EXISTS vector;
   ```
3. Copy connection credentials (`host`, `port`, `database`, `username`, `password`).

---

## ⚙️ 2. Backend Deployment (`knowflow-ai`)

### Option A: Render / Railway Deployment

1. Create a **Web Service** pointing to `knowflow-ai/`.
2. Environment: **Java 21 / Maven**.
3. Build Command:
   ```bash
   mvn clean package -DskipTests
   ```
4. Start Command:
   ```bash
   java -jar target/knowflow-ai-0.0.1-SNAPSHOT.jar
   ```
5. Set Environment Variables:
   ```env
   SPRING_DATASOURCE_URL=jdbc:postgresql://<DB_HOST>:<DB_PORT>/<DB_NAME>
   SPRING_DATASOURCE_USERNAME=<DB_USER>
   SPRING_DATASOURCE_PASSWORD=<DB_PASSWORD>
   JWT_SECRET=<YOUR_STRONG_RANDOM_32_CHAR_SECRET>
   CORS_ALLOWED_ORIGINS=https://<YOUR_FRONTEND_DOMAIN>.vercel.app
   SPRING_JPA_SHOW_SQL=false
   ```

---

## 🎨 3. Frontend Deployment (`knowflow-ui`)

### Option A: Vercel / Netlify Deployment

1. Import Git repository into **Vercel** or **Netlify**.
2. Set Root Directory to `knowflow-ui`.
3. Build Settings:
   - Framework Preset: **Vite**
   - Build Command: `npm run build`
   - Output Directory: `dist`
4. Set Environment Variables:
   ```env
   VITE_API_BASE_URL=https://<YOUR_BACKEND_DOMAIN>.onrender.com/api/v1
   ```
5. Deploy!

---

## 🛡️ Post-Deployment Verification

1. Access `https://<YOUR_FRONTEND_DOMAIN>/login`.
2. Register a new user account.
3. Access `/settings` and verify API key connection.
4. Test document upload & chat response in `/chat`.
5. Test System Design mode (`classDiagram` and `graph TD` rendering).
