# Backend Dockerfile
FROM node:18-alpine AS builder

WORKDIR /app

# Install build dependencies for canvas
RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    cairo-dev \
    jpeg-dev \
    pango-dev \
    giflib-dev \
    pixman-dev

# Copy package files
COPY package*.json ./
COPY tsconfig.json ./

# Install dependencies
RUN npm install

# Copy source code
COPY src ./src

# Build the application
RUN npm run build

# Production stage
FROM node:18-alpine

WORKDIR /app

# Install runtime and build dependencies for canvas (build deps needed for npm install)
RUN apk add --no-cache \
    cairo \
    jpeg \
    pango \
    giflib \
    pixman \
    python3 \
    make \
    g++ \
    cairo-dev \
    jpeg-dev \
    pango-dev \
    giflib-dev \
    pixman-dev

# Copy package files
COPY package*.json ./

# Install only production dependencies
RUN npm install --omit=dev

# Remove build dependencies to reduce image size
RUN apk del python3 make g++ cairo-dev jpeg-dev pango-dev giflib-dev pixman-dev

# Copy built application from builder
COPY --from=builder /app/dist ./dist

# Copy database initialization files
# Note: seed.sql is included in image but NOT executed in production
# It's only available for manual seeding if needed
COPY src/db/schema.sql /app/db/schema.sql
COPY src/db/seed.sql /app/db/seed.sql

# Expose port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3001/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start the application
CMD ["node", "dist/index.js"]

