## Быстрый старт

### 1. Поднять PostgreSQL и Redis

```bash
docker compose up -d
```

### 2. Настроить переменные окружения

Создай локальный `.env` файл и укажи значения:

```env
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
POSTGRES_DB=crm

DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=postgres
DB_NAME=crm
DB_SSLMODE=disable

REDIS_ADDR=localhost:6379
REDIS_PASSWORD=
REDIS_DB=0

JWT_ACCESS_SECRET=local-access-secret-change-me
JWT_REFRESH_SECRET=local-refresh-secret-change-me

ACCESS_TTL=15m
REFRESH_TTL=720h

HTTP_PORT=8080
```

Для production-like окружения секреты JWT должны быть длинными, случайными и не должны храниться в репозитории.

### 3. Запустить приложение

```bash
go run ./cmd/app
```

API будет доступен на:

```text
http://localhost:8080
```

## Endpoints

### Health check

```http
GET /health
```

Response:

```json
{
  "status": "ok"
}
```

### Register

```http
POST /auth/register
Content-Type: application/json
```

Request:

```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

### Login

```http
POST /auth/login
Content-Type: application/json
```

Request:

```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

Response:

```json
{
  "access_token": "...",
  "refresh_token": "..."
}
```

### Refresh tokens

```http
POST /auth/refresh
Content-Type: application/json
```

Request:

```json
{
  "refresh_token": "..."
}
```

### Logout

```http
POST /auth/logout
Content-Type: application/json
```

Request:

```json
{
  "refresh_token": "..."
}
```
