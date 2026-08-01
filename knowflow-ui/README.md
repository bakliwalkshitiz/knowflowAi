# 🎨 KnowFlow AI — React Frontend

The user interface for KnowFlow AI is a high-performance, responsive single-page web application built with React 19, Vite, and Framer Motion.

---

## ✨ Features & Component Highlights

- **Chat Workspace**: Multi-session persistent chat with inline paperclip document attachments, active mode pills (System Design, Summary, Flashcards, Quiz, Interview, Mind Map), and Vault document sidebar.
- **Mermaid.js Diagram Renderer**: Inline SVG renderer for Low-Level Design (UML `classDiagram`) and High-Level Architecture (`graph TD`) flows with error handling.
- **Dynamic Theme Switcher**: Linear/Vercel-inspired dark grey (`#121212`) and soft ivory (`#FFFFED`) light theme.
- **Live Analytics Dashboard**: Real-time stats computing total documents, vector chunks, chat sessions, AI tools count, and document vault status.
- **API Key Management**: Settings page input and sidebar indicator badge to connect custom OpenAI API keys directly from the browser.

---

## 🚀 Running Local Frontend

```bash
# Install dependencies
npm install

# Start Vite dev server
npm run dev

# Production build
npm run build
```

Dev Server running on: `http://localhost:5173`
