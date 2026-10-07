# ==============================================================================
# Customer Ordering Web App Dockerfile
# ==============================================================================

# 1. Build Stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy root monorepo manifests & customer package.json
COPY package.json package-lock.json ./
COPY apps/customer/package.json ./apps/customer/

# Install dependencies for customer app
RUN npm ci --workspace=apps/customer

# Copy source code
COPY apps/customer/ ./apps/customer/

# Build customer web app
RUN npm run --workspace=apps/customer build

# 2. Production Stage (Nginx)
FROM nginx:1.27-alpine AS runner

COPY --from=builder /app/apps/customer/dist /usr/share/nginx/html
COPY apps/customer/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
