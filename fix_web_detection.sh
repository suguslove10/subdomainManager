#!/bin/bash

echo "Fixing web server detection in Subdomain Manager..."

# Rebuild and restart the backend
echo "Rebuilding backend container..."
docker compose build backend
docker compose stop backend
docker compose rm -f backend
docker compose up -d backend

echo "Backend has been updated!"
echo "Wait a few moments for the service to start, then refresh your browser."
echo "You should now see 'nginx' detected as your web server."

# Instructions for the user
echo ""
echo "After the backend starts, you can run:"
echo "curl -X POST http://localhost:4000/api/subdomains/check-all-webservers"
echo "to manually trigger web server detection for all subdomains." 