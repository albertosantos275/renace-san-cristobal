# syntax=docker/dockerfile:1

# ---- Stage 1: build the React frontend ----
FROM node:20-slim AS frontend
WORKDIR /fe
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build          # outputs /fe/dist

# ---- Stage 2: build the Express/Prisma backend ----
FROM node:20-slim AS backend
RUN apt-get update && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY backend/package*.json ./
RUN npm ci
COPY backend/ ./
RUN npx prisma generate && npm run build   # tsc -> dist (incl. dist/seed.js)

# ---- Stage 3: runtime ----
FROM node:20-slim AS runtime
RUN apt-get update && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*
WORKDIR /app
ENV NODE_ENV=production
# Default DB location = the mounted Railway volume at /data. (Just a file path, not a
# secret.) Can still be overridden by a DATABASE_URL service variable if needed.
ENV DATABASE_URL=file:/data/prod.db
RUN mkdir -p /data
# Bring the fully-installed node_modules (includes Prisma client + CLI) from the build stage
COPY --from=backend /app/node_modules ./node_modules
COPY --from=backend /app/package.json ./package.json
COPY --from=backend /app/dist ./dist
COPY backend/prisma ./prisma
# The compiled frontend, served by Express in production
COPY --from=frontend /fe/dist ./public

EXPOSE 3001
# On boot: sync the SQLite schema to the volume, seed sectors+admin (idempotent), then start.
CMD ["sh", "-c", "npx prisma db push --skip-generate && node dist/seed.js && node dist/index.js"]
