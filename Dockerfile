FROM node:22-alpine AS base

WORKDIR /app

COPY package*.json ./

FROM base AS deps

RUN npm ci

FROM deps AS dev

ENV NODE_ENV=development

COPY . .

EXPOSE 8080

CMD ["npm", "run", "start:dev"]

FROM deps AS builder

COPY tsconfig*.json nest-cli.json prisma.config.ts ./
COPY prisma ./prisma
COPY src ./src
ARG DATABASE_URL=postgresql://postgres:postgres@postgres:5432/crm?schema=public
ENV DATABASE_URL=$DATABASE_URL
RUN npm run build

FROM deps AS prod-deps

RUN npm prune --omit=dev

FROM node:22-alpine AS production

WORKDIR /app
ENV NODE_ENV=production

COPY package*.json ./
COPY --from=prod-deps /app/node_modules ./node_modules

COPY prisma.config.ts ./
COPY prisma ./prisma
COPY --from=builder /app/dist ./dist

RUN chown -R node:node /app
USER node

EXPOSE 8080

CMD ["sh", "-c", "npx prisma migrate deploy && node dist/prisma/seed.js && node dist/main.js"]
