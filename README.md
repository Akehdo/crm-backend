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
    auth/      login/refresh/logout, JWT, refresh token storage
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
npm run db:setup
npm run start:dev
```

`db:setup` applies Prisma migrations and seeds the login user from:

```text
SEED_ADMIN_EMAIL
SEED_ADMIN_PASSWORD
SEED_ADMIN_ROLE
SEED_ADMIN_OVERWRITE
```

Change `SEED_ADMIN_PASSWORD` before running Docker on a server. Existing users are not
updated by seed unless `SEED_ADMIN_OVERWRITE=true`, so a container restart will not
silently reset the admin password.

For existing databases that were created with `prisma db push` before migrations were
added, mark the first migration as already applied after verifying the schema:

```bash
npx prisma migrate resolve --applied 20260705110423_first_migration
npx prisma migrate deploy
```

For migration diff checks against migration history, create a separate local shadow
database and set `SHADOW_DATABASE_URL`.

For Docker dev mode:

```bash
cp .env.example .env
docker compose --env-file .env -f docker-compose.yml -f docker-compose.dev.yml up --build
```

This starts Postgres, Redis, the backend in Nest watch mode, and the frontend in
Vite dev mode.

### Production Docker Compose

Production compose keeps Postgres, Redis, and the backend private on an internal
Docker network. Only the frontend/nginx container is published on
`FRONTEND_BIND:FRONTEND_PORT`.

Create the production env file:

```bash
cp .env.production.example .env.production
```

Fill in real secrets in `.env.production`, then run:

```bash
docker compose --env-file .env.production -f docker-compose.yml -f docker-compose.prod.yml up -d --build
```

Point your reverse proxy to the published frontend port, or keep
`FRONTEND_BIND=0.0.0.0` and `FRONTEND_PORT=80` to publish nginx directly. Postgres,
Redis, and the backend stay reachable only inside the internal Docker network.

If you already started the old auto-increment ID schema locally, PostgreSQL may need a fresh
dev volume before applying the UUID primary key schema:

```bash
docker compose --env-file .env -f docker-compose.yml -f docker-compose.dev.yml down -v
docker compose --env-file .env -f docker-compose.yml -f docker-compose.dev.yml up --build
```

In dev mode, the API listens on:

```text
http://localhost:8080
```

### Endpoints

```http
GET /health
POST /auth/login
POST /auth/refresh
POST /auth/logout
GET /parcels?page=1&limit=20&status=added
GET /parcels/:track_number
POST /parcels
PUT /parcels/status
POST /records
PATCH /records/:id
```
