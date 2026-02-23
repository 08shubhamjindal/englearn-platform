# EngLearn Backend

## Quick Start

### Prerequisites
- Java 17+
- Maven 3.8+

### Run locally (H2 in-memory DB)
```bash
cd backend
mvn spring-boot:run
```
The app starts at `http://localhost:8080`.  
H2 console available at `http://localhost:8080/h2-console`.

### Google OAuth2 Setup
1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a project → **EngLearn**
3. Navigate to **APIs & Services → Credentials**
4. Create **OAuth 2.0 Client ID** (Web application)
5. Add authorized redirect URI: `http://localhost:8080/login/oauth2/code/google`
6. Set environment variables before running:

```bash
set GOOGLE_CLIENT_ID=your-client-id-here
set GOOGLE_CLIENT_SECRET=your-client-secret-here
mvn spring-boot:run
```

### Switch to PostgreSQL
1. Install PostgreSQL and create a database:
   ```sql
   CREATE DATABASE englearn;
   ```
2. Run the schema: `psql -d englearn -f src/main/resources/schema.sql`
3. Update `application.yml` — uncomment the Postgres lines, comment out H2.

### Environment Variables
| Variable | Description | Default |
|----------|-------------|---------|
| `GOOGLE_CLIENT_ID` | Google OAuth client ID | *(required)* |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret | *(required)* |
| `JWT_SECRET` | JWT signing key (min 64 chars) | dev default |
| `FRONTEND_URL` | Frontend URL for redirect after login | `http://localhost:5500` |
