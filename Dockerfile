FROM node:22-alpine AS deps

WORKDIR /app

COPY package*.json ./
RUN npm ci

FROM deps AS builder

COPY tsconfig*.json nest-cli.json prisma.config.ts ./
COPY prisma ./prisma
COPY src ./src
ARG DATABASE_URL=postgresql://postgres:postgres@postgres:5432/crm?schema=public
ENV DATABASE_URL=$DATABASE_URL
RUN npm run build

FROM node:22-alpine AS runner

WORKDIR /app
ENV NODE_ENV=production

COPY package*.json ./
RUN npm ci --omit=dev

COPY prisma.config.ts ./
COPY prisma ./prisma
COPY --from=builder /app/dist ./dist

RUN chown -R node:node /app
USER node

EXPOSE 8080

CMD ["sh", "-c", "npx prisma migrate deploy && node dist/prisma/seed.js && node dist/main.js"]
