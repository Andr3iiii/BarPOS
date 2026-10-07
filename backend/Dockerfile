# ==============================================================================
# Backend Dockerfile (Node.js 20 Alpine)
# ==============================================================================

# 1. Build Stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy root monorepo manifests & backend package.json
COPY package.json package-lock.json ./
COPY backend/package.json ./backend/

# Install dependencies for backend
RUN npm ci --workspace=backend

# Copy source code
COPY backend/ ./backend/
COPY database/ ./database/

# Build backend
RUN npm run --workspace=backend build

# 2. Production Stage
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=4000

# Copy root and backend manifests
COPY package.json package-lock.json ./
COPY backend/package.json ./backend/

# Install only production dependencies for backend
RUN npm ci --omit=dev --workspace=backend

# Copy compiled artifacts from builder
COPY --from=builder /app/backend/dist ./backend/dist
COPY database/ ./database/

EXPOSE 4000

CMD ["node", "backend/dist/server.js"]
