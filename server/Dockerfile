# Base image
FROM node:20-alpine

# Create app directory
WORKDIR /app

# Install dependencies first (layer caching)
COPY package*.json ./
RUN npm install

# Copy source code
COPY . .

# Expose backend port
EXPOSE 3000

# Start server
CMD ["npm", "run", "dev"]
