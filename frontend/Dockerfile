# Stage 1: Builder - Install all dependencies including devDependencies
FROM node:18-alpine AS builder

WORKDIR /app

# 1. Copy package files first for better caching
COPY package.json package-lock.json ./

# 2. Install ALL dependencies (including devDependencies needed for build)
RUN npm ci && \
    npm cache clean --force

# 3. Copy source files
COPY . .

# 4. Build the application
RUN npm run build

# Stage 2: Runtime - Ultra-light production image
FROM nginx:1.25-alpine

# 1. Remove default configuration
RUN rm -rf /etc/nginx/conf.d/default.conf

# 2. Copy custom nginx configuration
COPY nginx.conf /etc/nginx/conf.d/

# 3. Copy built assets from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# 4. Security hardening
RUN chown -R nginx:nginx /var/cache/nginx && \
    chmod -R 755 /var/cache/nginx

# 5. Health check
HEALTHCHECK --interval=30s --timeout=3s \
    CMD curl -f http://localhost/ || exit 1

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]