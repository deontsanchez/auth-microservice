# Build stage
FROM node:18-alpine AS build

WORKDIR /usr/src/app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install all dependencies including dev dependencies
RUN npm ci

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Production stage
FROM node:18-alpine AS production

# Set to production environment
ENV NODE_ENV=production

WORKDIR /usr/src/app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install only production dependencies
RUN npm ci --only=production

# Copy built assets from build stage
COPY --from=build /usr/src/app/dist ./dist

# Add healthcheck
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 CMD wget -q -O- http://localhost:3000/health || exit 1

# Set user to non-root
USER node

# Expose port
EXPOSE 3000

# Start the application
CMD ["npm", "start"] 