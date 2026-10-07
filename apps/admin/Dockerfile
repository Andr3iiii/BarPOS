# ==============================================================================
# Admin Portal Web App Dockerfile
# ==============================================================================

# 1. Build Stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy root monorepo manifests & admin package.json
COPY package.json package-lock.json ./
COPY apps/admin/package.json ./apps/admin/

# Install dependencies for admin web app
RUN npm ci --workspace=apps/admin

# Copy source code
COPY apps/admin/ ./apps/admin/

# Build admin web app
RUN npm run --workspace=apps/admin build

# 2. Production Stage (Nginx)
FROM nginx:1.27-alpine AS runner

COPY --from=builder /app/apps/admin/dist /usr/share/nginx/html
COPY apps/admin/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
