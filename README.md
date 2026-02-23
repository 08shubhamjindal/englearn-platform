# EngLearn — Engineering Papers, Simplified

Interactive platform that breaks down complex engineering papers into simplified, chapter-by-chapter reading experiences with animated diagrams.

## Structure

```
englearn-platform/
├── docs/       ← Frontend (HTML/CSS/JS) — served by GitHub Pages
├── backend/    ← Backend API (Java / Spring Boot)
```

## Live Demo

🌐 [https://08shubhamjindal.github.io/englearn-platform/](https://08shubhamjindal.github.io/englearn-platform/)

## Papers Available

- **Amazon Dynamo** — Highly Available Key-Value Store
- **Raft** — Consensus Algorithm
- **DocStore** — Document Storage System

## Running Locally

### Frontend
```bash
cd docs
python -m http.server 5500
# Open http://localhost:5500
```

### Backend
```bash
# 1. Set environment variables (see .env.example)
# 2. Run:
cd backend
mvn spring-boot:run
# API available at http://localhost:8080
```

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Vanilla JS, CSS |
| Backend | Java 17, Spring Boot 3 |
| Auth | Google OAuth2 + JWT |
| Database | PostgreSQL (H2 for dev) |

## Environment Variables

See [.env.example](.env.example) for required variables.
