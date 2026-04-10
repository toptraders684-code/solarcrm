# ── Stage 1: Build frontend ──────────────────────────────────────────
FROM node:20-alpine AS frontend-builder

WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build
# Output → /app/frontend/../backend/public = /app/backend/public


# ── Stage 2: Build backend ────────────────────────────────────────────
FROM node:20-alpine AS backend-builder

WORKDIR /app/backend
COPY backend/package*.json ./
RUN npm ci
COPY backend/ ./
COPY --from=frontend-builder /app/backend/public ./public
RUN npx prisma generate && npm run build


# ── Stage 3: Production image ─────────────────────────────────────────
FROM node:20-alpine

WORKDIR /app/backend

# Copy compiled backend
COPY --from=backend-builder /app/backend/dist ./dist
COPY --from=backend-builder /app/backend/node_modules ./node_modules
COPY --from=backend-builder /app/backend/package.json ./package.json
COPY --from=backend-builder /app/backend/prisma ./prisma

# Copy built frontend (served as static files by NestJS)
COPY --from=backend-builder /app/backend/public ./public

# Uploads directory (Railway Volume will be mounted here)
RUN mkdir -p /app/backend/uploads

EXPOSE 3000

CMD ["sh", "-c", "npx prisma migrate deploy && node dist/src/main"]
