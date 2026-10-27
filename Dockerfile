# Explore Wings Digital Technologies - Production Dockerfile
FROM node:22-alpine AS builder

WORKDIR /app

# Install native dependencies required for better-sqlite3 and sharp compilation
RUN apk add --no-cache python3 make g++

COPY package*.json ./
RUN npm ci --omit=dev

COPY . .

# Multi-stage production image for small footprint
FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

# Install runtime dependencies for SQLite
RUN apk add --no-cache vips-dev

COPY --from=builder /app /app

# Expose HTTP port
EXPOSE 3000

# Run server with node
CMD ["node", "server.js"]
