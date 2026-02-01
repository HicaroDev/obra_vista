# Stage 1: Build Frontend
FROM node:20-alpine as frontend-builder

WORKDIR /app/frontend

# Install dependencies
COPY frontend/package*.json ./
# Usando npm install para garantir que funcione mesmo sem package-lock.json
RUN npm install

# Build frontend
COPY frontend/ .
# Ensure tailwindwindcss and other build tools are available
# Configurar URL da API relativa para funcionar no mesmo domínio
ENV VITE_API_URL=/api
RUN npm run build

# Stage 2: Setup Backend & Runtime
FROM node:20-alpine

WORKDIR /app

# Install system dependencies (OpenSSL is required for Prisma)
RUN apk add --no-cache openssl

WORKDIR /app/backend

# Install backend dependencies
COPY backend/package*.json ./
# Usando npm install --only=production para instalar apenas dependencias de produção
RUN npm install --only=production

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
CMD ["npm", "start"]
