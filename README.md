# Subdomain Manager

A web-based application for managing subdomains, automating SSL certificates, and handling AWS credentials.

## Features

- Subdomain management through a web UI
- Automatic detection of server's public IP
- Web server detection for domains/subdomains
- Automated SSL certificate issuance via Let's Encrypt
- Secure AWS credential management

## Prerequisites

- Docker and Docker Compose
  - For Ubuntu, you can install Docker with:
    ```
    sudo apt update
    sudo apt install docker.io
    sudo systemctl enable --now docker
    sudo usermod -aG docker $USER
    ```
  - Recent Docker installations include Docker Compose as `docker compose` command

## Quick Start

1. Clone this repository
2. Run the startup script:
   ```
   chmod +x start.sh
   ./start.sh
   ```
   Or manually with Docker Compose:
   ```
   docker compose up -d
   ```
3. Access the application at `http://localhost:3000`

## Architecture

- Frontend: React application
- Backend: Node.js with Express
- Database: MongoDB for persistent storage
- Docker: Containerized deployment
- SSL: Let's Encrypt integration

## Security Considerations

- AWS credentials are encrypted at rest
- HTTPS is enforced for the admin interface
- Regular security audits recommended

## Troubleshooting

If you encounter issues with the backend service restarting repeatedly, it may be due to Node.js ESM compatibility issues. This has been fixed in the latest version by using dynamic imports for ESM packages.

Check the logs with:
```
docker compose logs backend
```

You can restart the services with:
```
docker compose restart
```

## Development

To modify or extend the application:
1. Make your changes to the source code
2. Rebuild the Docker containers with:
   ```
   docker compose build
   docker compose up -d
   ```
