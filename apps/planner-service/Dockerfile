# planner-service — Multi-stage Docker build
# Classification: Protected B — ATIA s.23
# Base image: node:20-alpine (minimal attack surface, non-root user)

# ============================================================
# Stage 1: Builder
# Builds the TypeScript application using Nx
# ============================================================
FROM node:20-alpine AS builder

WORKDIR /build

# Copy workspace package manifests and lock file first (layer caching)
COPY package*.json ./
COPY nx.json ./
COPY tsconfig*.json ./

# Install all dependencies (including devDeps for build)
RUN npm ci --ignore-scripts

# Copy application source
COPY apps/planner-service ./apps/planner-service
COPY packages ./packages

# Run the Nx build for the planner-service target
RUN npx nx build planner-service --configuration=production

# ============================================================
# Stage 2: Runtime
# Minimal image — only production node_modules + built dist
# ============================================================
FROM node:20-alpine AS runtime

# Security: run as non-root user (node user is built into node:alpine)
USER node

WORKDIR /app

# Copy built output from builder stage
COPY --from=builder --chown=node:node /build/dist/apps/planner-service ./dist

# Copy only production dependencies
COPY --from=builder --chown=node:node /build/node_modules ./node_modules

# Service port (matches ADSP CODEMAP and environment default)
EXPOSE 7796

# Health check — uses wget (available in alpine); no auth required on /health
HEALTHCHECK --interval=30s --timeout=10s --start-period=15s --retries=3 \
  CMD wget -qO- http://localhost:7796/health || exit 1

# Entry point — run the compiled main module
CMD ["node", "dist/main.js"]
