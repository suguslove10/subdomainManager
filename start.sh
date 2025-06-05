#!/bin/bash

# Print commands and exit on errors
set -e

echo "Starting Subdomain Manager..."

# Build and start containers
echo "Building and starting Docker containers..."
docker-compose down
docker-compose build
docker-compose up -d

# Wait for backend to be ready
echo "Waiting for backend service to be ready..."
ATTEMPTS=0
MAX_ATTEMPTS=30
BACKEND_READY=false

while [ $ATTEMPTS -lt $MAX_ATTEMPTS ]; do
  if docker-compose logs backend | grep -q "Server running on port"; then
    BACKEND_READY=true
    break
  fi
  ATTEMPTS=$((ATTEMPTS+1))
  echo "Waiting for backend service... (attempt $ATTEMPTS/$MAX_ATTEMPTS)"
  sleep 5
done

if [ "$BACKEND_READY" = true ]; then
  echo "Backend service is ready!"
  echo "Subdomain Manager is now running!"
  echo "- Frontend: http://localhost:3000"
  echo "- Backend API: http://localhost:4000"
  echo "- Admin UI is accessible at: http://localhost:3000"
else
  echo "Backend service failed to start properly. Check the logs with 'docker-compose logs backend'"
fi

# Print container status
echo ""
echo "Container status:"
docker-compose ps 