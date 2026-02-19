# 🛡️ Sentinel Event Hub - Deployment Guide

Complete guide for installing the application on a private server (VPS) using Docker.

---

## 📋 Server Requirements

The server must have the following installed:

- **Docker** (version 20+)
- **Docker Compose** (version 2+)
- **Git**

### Quick Installation on Ubuntu/Debian:
```bash
# Install Docker
curl -fsSL https://get.docker.com | sh

# Add current user to the docker group (to avoid using sudo)
sudo usermod -aG docker $USER

# Log out and log back in to apply changes
```

---

## 🚀 Installation Steps

### 1. Clone the project to your server

```bash
git clone https://github.com/epictetus-from-hierapolis/sentinel-v2.git
cd sentinel-v2
```

### 2. Create directories for persistent data

```bash
mkdir -p data/recordings data/thumbnails
```

### 3. Configure environment variables

```bash
# Copy the example file
cp .env.production.example .env

# Edit with your values
nano .env
```

**Mandatory fields to complete in `.env`:**

| Variable | Action |
|---|---|
| `AUTH_SECRET` | Run `openssl rand -base64 32` and paste the result |
| `NEXTAUTH_URL` | Set the server's IP or domain (e.g., `http://123.45.67.89:3000`) |
| `SENTINEL_ADMIN_EMAIL` | Email for the admin account |
| `SENTINEL_ADMIN_PASSWORD` | A strong password for the admin |
| `CAMERA_X_IP` etc. | Your IP camera credentials |

### 4. Start the application

```bash
docker compose up -d --build
```

> The first start takes longer (5-10 minutes) as it builds the Docker image.

### 5. Verify it's running

```bash
# Check container status
docker compose ps

# View real-time logs
docker compose logs -f
```

The application is available at: `http://SERVER_IP:3000`

---

## 👤 Creating the First Admin User

On the first run, execute the admin creation script:

```bash
docker compose exec sentinel-hub node scripts/create-user.mjs
```

> The script uses `SENTINEL_ADMIN_EMAIL` and `SENTINEL_ADMIN_PASSWORD` from `.env`.

---

## 🔄 Updating the Application

When a new version is available:

```bash
# Download changes
git pull

# Rebuild and restart the container
docker compose up -d --build
```

The database and video recordings are stored in the `./data/` folder and **are not deleted** during updates.

---

## 💾 Backup

To backup the system, simply archive the `./data/` folder:

```bash
# Create an archive with all data
tar -czf sentinel-backup-$(date +%Y%m%d).tar.gz data/
```

---

## 🛑 Stop and Start

```bash
# Stop
docker compose down

# Start
docker compose up -d

# Restart
docker compose restart
```

---

## 🔧 Troubleshooting

**Container won't start:**
```bash
docker compose logs sentinel-hub
```

**Database corrupted:**
```bash
# Stop the container
docker compose down

# Delete the database (CAUTION: all data will be lost!)
rm data/sentinel.db

# Restart (it will create a new empty database)
docker compose up -d
```

**Port 3000 already in use:**
Edit `docker-compose.yml` and change `"3000:3000"` to `"ALT_PORT:3000"`.

---

## 🌐 Nginx Configuration (Optional, for Domain + HTTPS)

If you want to access the app at `https://sentinel.yourdomain.com` instead of `http://IP:3000`, install Nginx and Certbot on your server and configure a reverse proxy:

```nginx
server {
    server_name sentinel.yourdomain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Then run: `sudo certbot --nginx -d sentinel.yourdomain.com`
