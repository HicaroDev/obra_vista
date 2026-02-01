# Stage 1: Build Frontend
FROM node:20-alpine as frontend-builder

WORKDIR /app/frontend

# Install dependencies (incorporating cache)
COPY frontend/package*.json ./
RUN npm ci

# Build frontend
COPY frontend/ .
# Ensure tailwindwindcss and other build tools are available
RUN npm run build

# Stage 2: Setup Backend & Runtime
FROM node:20-alpine

WORKDIR /app

# Install system dependencies (OpenSSL is required for Prisma)
RUN apk add --no-cache openssl

WORKDIR /app/backend

# Install backend dependencies
COPY backend/package*.json ./
RUN npm ci --only=production

# Copy backend source code
COPY backend/ .

# Copy built frontend assets to 'public' folder in backend
COPY --from=frontend-builder /app/frontend/dist ./public

# Generate Prisma Client
# Note: DATABASE_URL is needed for migration deployment, but generate works without it
RUN npx prisma generate

# Final setup
ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000

# Start command
# We use a shell command to ensure migrations run if needed, but for safety in generic envs, just start
CMD ["npm", "start"]
