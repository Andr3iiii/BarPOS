# ==============================================================================
# Cashier POS Web Terminal Dockerfile
# ==============================================================================

# 1. Build Stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy root monorepo manifests & pos package.json
COPY package.json package-lock.json ./
COPY apps/pos/package.json ./apps/pos/

# Install dependencies for POS web app
RUN npm ci --workspace=apps/pos

# Copy source code
COPY apps/pos/ ./apps/pos/

# Build POS web app
RUN npm run --workspace=apps/pos build

# 2. Production Stage (Nginx)
FROM nginx:1.27-alpine AS runner

COPY --from=builder /app/apps/pos/dist /usr/share/nginx/html
COPY apps/pos/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
