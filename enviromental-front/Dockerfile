# Multi-stage Angular Frontend Dockerfile

# Stage 1: Build the Angular application
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --prefer-offline --no-audit

# Copy application source
COPY . .

# Build the application for production with SSR
RUN npm run build

# Stage 2: Production image with Node.js for SSR
FROM node:20-alpine AS production

WORKDIR /app

# Copy only the built application from builder stage
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package*.json ./

# Install only production dependencies needed for SSR server
RUN npm ci --omit=dev --prefer-offline --no-audit

# Set environment variables
ENV NODE_ENV=production \
    PORT=4000

# Expose port
EXPOSE 4000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD node -e "require('http').get('http://localhost:4000', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})" || exit 1

# Start SSR server
CMD ["npm", "run", "serve:ssr:enviromental-front"]

# Stage 3: Development image (optional - for dev mode)
FROM node:20-alpine AS development

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

EXPOSE 4200

CMD ["npm", "start", "--", "--host", "0.0.0.0", "--poll", "2000"]
