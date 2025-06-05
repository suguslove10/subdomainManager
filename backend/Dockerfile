FROM node:18-alpine

WORKDIR /app

# Install system dependencies
RUN apk add --no-cache python3 make g++ certbot curl bind-tools

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy application code
COPY . .

# Expose port
EXPOSE 4000

# Start application
CMD ["npm", "start"] 