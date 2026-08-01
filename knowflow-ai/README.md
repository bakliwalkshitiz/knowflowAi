# ⚙️ KnowFlow AI — Spring Boot Backend

The backend for KnowFlow AI is a production-grade Spring Boot 3 microservice built with Spring AI, PostgreSQL PGVector, Spring Security, and JWT.

---

## 🛠️ Tech Stack & Key Components

- **Spring Boot 3.4**: Core Java REST API application.
- **Spring AI 1.0.0**: OpenAI Integration (`gpt-4o-mini`, `text-embedding-3-small`, and Function Calling tools).
- **Spring Data JPA & PGVector**: Vector similarity search with cosine distance indexing.
- **Spring Security & JWT**: Stateless token authentication with BCrypt password hashing.
- **SpringDoc OpenAPI**: Swagger UI generated API documentation.

---

## 📁 Package Architecture

```text
com.knowflow
├── ai/
│   ├── config/        # ChatMemory & VectorStore beans
│   ├── controller/    # ChatController, RagController
│   ├── prompt/        # PromptTemplateFactory (LLD/HLD/Summary/Quiz/Flashcards)
│   ├── service/       # ChatService, VectorStoreService
│   └── tools/         # 7 Function Calling Tools (Math, Weather, UUID, Code, etc.)
├── auth/
│   ├── controller/    # AuthController (/login, /register)
│   ├── dto/           # AuthRequest, AuthResponse
│   └── security/      # JwtAuthenticationFilter, SecurityConfig, JwtTokenProvider
├── document/
│   ├── controller/    # DocumentController
│   ├── entity/        # Document entity
│   ├── repository/    # DocumentRepository with JPQL DocumentStats projection
│   └── service/       # DocumentService file processor
├── user/
│   ├── controller/    # UserController (/api-key GET & POST)
│   ├── entity/        # User entity with apiKey column
│   └── service/       # UserService
└── common/            # Enums, Global Exception Handler, Security Utils
```

---

## 🚀 Running Local Backend

```bash
# Build jar
mvn clean package -DskipTests

# Run Spring Boot application
mvn spring-boot:run
```

API Documentation will be accessible at: `http://localhost:8080/swagger-ui.html`
