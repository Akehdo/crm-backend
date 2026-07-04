## CRM Backend

NestJS + Prisma backend for the CRM project.

### Stack

- TypeScript
- NestJS
- Prisma
- PostgreSQL
- Redis
- JWT access tokens + rotating refresh tokens

### Modular layout

```text
src/
  config/      env parsing
  modules/
    auth/      login/register/refresh/logout, JWT, refresh token storage
    users/     user persistence
    parcels/   parcel CRUD/status workflows
    records/   record creation
  generated/   generated Prisma Client
  prisma/      Prisma client provider
  redis/       Redis provider
```

### Quick start

Create a local env file:

```powershell
Copy-Item .env.local.example .env
```

Or on Unix-like shells:

```bash
cp .env.local.example .env
```

Then run:

```bash
npm install
npm run prisma:push
npm run start:dev
```

For Docker:

```bash
docker compose up --build
```

The API listens on:

```text
http://localhost:8080
```

### Endpoints

```http
GET /health
POST /auth/register
POST /auth/login
POST /auth/refresh
POST /auth/logout
GET /parcels?page=1&limit=20&status=added
GET /parcels/:track_number
POST /parcels
PUT /parcels/status
POST /records
```
