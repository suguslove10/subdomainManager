#!/bin/bash

# Print commands and exit on errors
set -e

echo "Restarting Subdomain Manager Backend..."

# Check if we're already in the subdomainManager directory
if [ ! -f "docker-compose.yml" ] && [ ! -f "docker-compose.yaml" ]; then
  # If we're not in the subdomainManager directory, try to navigate there
  if [ -d "subdomainManager" ]; then
    cd subdomainManager
  else
    echo "Error: Could not find the subdomainManager directory"
    exit 1
  fi
fi

# Rebuild and restart just the backend service
echo "Rebuilding backend container..."
docker compose build backend
docker compose stop backend
docker compose rm -f backend
docker compose up -d backend

# Wait for backend to be ready
echo "Waiting for backend service to be ready..."
ATTEMPTS=0
MAX_ATTEMPTS=15
BACKEND_READY=false

while [ $ATTEMPTS -lt $MAX_ATTEMPTS ]; do
  if docker compose logs backend | grep -q "Server running on port"; then
    BACKEND_READY=true
    break
  fi
  ATTEMPTS=$((ATTEMPTS+1))
  echo "Waiting for backend service... (attempt $ATTEMPTS/$MAX_ATTEMPTS)"
  sleep 2
done

if [ "$BACKEND_READY" = true ]; then
  echo "Backend service is ready!"
  echo "Subdomain Manager backend has been restarted!"
else
  echo "Backend service failed to start properly. Check the logs with 'docker compose logs backend'"
fi

# Show backend logs
echo "Recent backend logs:"
docker compose logs --tail=20 backend 