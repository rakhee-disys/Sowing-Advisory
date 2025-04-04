# Stage 1: Build the application
FROM node:18-alpine AS builder

WORKDIR /app

# Copy dependency files first (for caching)
COPY package*.json ./
COPY yarn.lock ./

# Install dependencies (use npm or yarn)
RUN yarn install --frozen-lockfile

# Copy all source files
COPY . .

# Build the production bundle
RUN yarn build  # or `npm run build`

# ----------------------------

# Stage 2: Serve with Nginx
FROM nginx:alpine

# Remove default Nginx config
RUN rm -rf /etc/nginx/conf.d/default.conf

# Copy custom Nginx config
COPY nginx.conf /etc/nginx/conf.d/

# Copy built files from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html  # For Vue/Angular
# OR for Create-React-App:
# COPY --from=builder /app/build /usr/share/nginx/html

# Expose port 80 (Nginx default)
EXPOSE 80

# Start Nginx
CMD ["nginx", "-g", "daemon off;"]