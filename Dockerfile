# syntax=docker/dockerfile:1
# Multi-stage build for the BLAST backend (serves the API + static frontend).

# 1) Install production dependencies only, using the lockfile for reproducibility.
FROM node:22-alpine AS deps
WORKDIR /app/src/backend
COPY src/backend/package.json src/backend/package-lock.json ./
RUN npm ci --omit=dev

# 2) Minimal runtime image.
FROM node:22-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production \
    PORT=3000
# Run as the built-in non-root user for safety.
COPY --from=deps /app/src/backend/node_modules ./src/backend/node_modules
COPY src/backend ./src/backend
COPY src/frontend ./src/frontend
# The API imports lead enrichment + Instantly export from crm/ (../../crm/*).
COPY crm ./crm
USER node
EXPOSE 3000
WORKDIR /app/src/backend
CMD ["node", "server.js"]
