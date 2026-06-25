# CyberCom Platform — Deployment Guide

## Overview

This guide covers automated deployment to the OCI VM using GitHub Actions.

**Deployment Target:**
- Host: `158.178.130.4`
- Region: `il-jerusalem-1`
- Instance Type: `VM.Standard.A1.Flex` (ARM64)
- OS: Ubuntu 22.04 LTS

## Prerequisites

### On OCI VM (One-time setup)

1. **SSH Access Setup**
   ```bash
   # Generate deployment key (if not already done)
   ssh-keygen -t ed25519 -C "cybercom-deploy" -f ~/.ssh/cybercom_deploy -N ""
   
   # Add to authorized_keys
   cat ~/.ssh/cybercom_deploy.pub >> ~/.ssh/authorized_keys
   ```

2. **Install Docker & Dependencies**
   ```bash
   # Install Docker
   curl -fsSL https://get.docker.com | sh
   sudo usermod -aG docker ubuntu
   
   # Install dependencies
   sudo apt-get update
   sudo apt-get install -y \
     docker-compose-plugin \
     nginx \
     certbot \
     python3-certbot-nginx \
     curl
   
   # Create app directory
   sudo mkdir -p /opt/cybercom/platform
   sudo chown ubuntu:ubuntu /opt/cybercom/platform
   
   # Copy Nginx config from repo
   sudo cp infrastructure/nginx/conf.d/cybercom.conf /etc/nginx/conf.d/
   sudo nginx -t
   sudo systemctl enable nginx
   sudo systemctl start nginx
   ```

3. **Configure SSL Certificates**
   
   **Wait for DNS to propagate (up to 48 hours), then:**
   
   ```bash
   sudo certbot --nginx \
     -d cy-com.com -d www.cy-com.com -d api.cy-com.com \
     -d health.cy-com.com -d provider.cy-com.com \
     -d hospital.cy-com.com -d clinic.cy-com.com \
     -d lab.cy-com.com -d imaging.cy-com.com \
     -d pharmacy.cy-com.com -d portal.cy-com.com \
     -d partners.cy-com.com -d docs.cy-com.com \
     --email m.alnsour@outlook.com \
     --agree-tos \
     --non-interactive \
     --redirect
   
   # Set up auto-renewal
   sudo systemctl enable certbot.timer
   sudo systemctl start certbot.timer
   ```

### In GitHub Repository

1. **Add the following secrets** in `Settings → Secrets and variables → Actions`

## Required GitHub Secrets

Navigate to your repository's **Settings → Secrets and variables → Actions** and add:

| Secret Name | Description | Example |
|---|---|---|
| `OCI_VM_HOST` | OCI VM IP address | `158.178.130.4` |
| `OCI_VM_USER` | SSH username | `ubuntu` |
| `SSH_PRIVATE_KEY` | Private key for SSH access | (see below) |
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://cybercom:password@localhost/cybercom` |
| `REDIS_URL` | Redis connection string | `redis://:password@localhost:6379/0` |
| `JWT_SECRET` | JWT signing secret | Generate: `openssl rand -hex 32` |
| `POSTGRES_PASSWORD` | PostgreSQL password | Generate: `openssl rand -hex 16` |
| `REDIS_PASSWORD` | Redis password | Generate: `openssl rand -hex 16` |
| `OCI_TENANCY_OCID` | OCI Tenancy OCID | From OCI Console |
| `ALLOWED_HOSTS` | Comma-separated hosts | `api.cy-com.com,cy-com.com,localhost` |

### Generating SSH Key

On your local machine:

```bash
# Generate SSH key (if not already done)
ssh-keygen -t ed25519 -C "cybercom-deploy@github" -f ~/.ssh/cybercom_deploy_github -N ""

# Display the private key
cat ~/.ssh/cybercom_deploy_github
```

1. Copy the **entire private key** (including `-----BEGIN PRIVATE KEY-----` and `-----END PRIVATE KEY-----`)
2. Add it as the `SSH_PRIVATE_KEY` secret in GitHub
3. On the OCI VM, append the **public key** to `~/.ssh/authorized_keys`:
   ```bash
   echo "SSH_PUBLIC_KEY_HERE" >> ~/.ssh/authorized_keys
   ```

### Generating Secrets

Use these commands to generate secure secrets:

```bash
# JWT Secret (32 bytes, hex-encoded)
openssl rand -hex 32

# PostgreSQL Password (16 bytes, hex-encoded)
openssl rand -hex 16

# Redis Password (16 bytes, hex-encoded)
openssl rand -hex 16
```

## Deployment Configuration

### Environment Variables in `.env`

The deployment script automatically generates `.env` on the VM with:

```
IMAGE_TAG=<commit-sha>
DATABASE_URL=<secret>
REDIS_URL=<secret>
JWT_SECRET=<secret>
POSTGRES_PASSWORD=<secret>
REDIS_PASSWORD=<secret>
OCI_TENANCY_OCID=<secret>
ALLOWED_HOSTS=api.cy-com.com,cy-com.com,localhost
ENVIRONMENT=production
LOG_LEVEL=INFO
```

## Deployment Workflow

### Automatic Deployment

1. **Trigger**: Push to `main` branch automatically starts deployment
2. **Build Phase**: Docker images are built for ARM64 architecture
3. **Deploy Phase**: 
   - SSH into OCI VM
   - Copy application files
   - Run deployment script
   - Verify services are healthy
4. **Verification**: Health checks confirm the application is running

### Manual Deployment

1. Go to **Actions → Deploy to OCI VM**
2. Click **Run workflow**
3. Select `production` or `staging` environment
4. Click **Run workflow**

## Monitoring Deployments

### View Workflow Status

- Go to **Actions** tab
- Click on **Deploy to OCI VM** workflow
- View logs for each job: Build, Deploy, Notify

### SSH into OCI VM for Manual Inspection

```bash
ssh -i ~/.ssh/cybercom_deploy ubuntu@158.178.130.4

# View running services
cd /opt/cybercom/platform
docker-compose ps

# View logs
docker-compose logs -f api
docker-compose logs -f nginx
docker-compose logs -f postgres

# Check health
curl http://localhost:8000/health
```

### View Application Logs

```bash
# API logs
docker logs -f cybercom-api

# Nginx logs
docker logs -f cybercom-nginx

# Worker logs
docker logs -f cybercom-worker

# Database logs
docker logs -f cybercom-postgres
```

## Troubleshooting

### Deployment Fails: SSH Connection Error

**Problem**: `ssh: connect to host 158.178.130.4 port 22: Connection refused`

**Solution**:
1. Verify the VM is running: Check OCI Console
2. Verify security rules allow SSH (port 22) from GitHub Actions IP
3. Test manually: `ssh -i ~/.ssh/cybercom_deploy ubuntu@158.178.130.4`

### Deployment Fails: Permission Denied

**Problem**: `Permission denied (publickey)`

**Solution**:
1. Verify private key is correctly stored in `SSH_PRIVATE_KEY` secret
2. Verify public key is in `~/.ssh/authorized_keys` on VM
3. Check SSH key permissions: `chmod 600 ~/.ssh/authorized_keys`

### Services Don't Start

**Problem**: `docker-compose up` returns errors

**Solution**:
```bash
# SSH into VM and check logs
ssh ubuntu@158.178.130.4
docker-compose -f /opt/cybercom/platform/docker-compose.yml logs api

# Common issues:
# - Port 8000 already in use: kill process or change port
# - Database connection failed: verify DATABASE_URL secret
# - Out of disk space: check `df -h`
```

### Health Check Fails

**Problem**: `curl: (7) Failed to connect to 127.0.0.1 port 8000`

**Solution**:
1. Verify containers are running: `docker ps`
2. Check API logs: `docker logs cybercom-api`
3. Verify health endpoint exists in your backend
4. Check Nginx configuration: `sudo nginx -t`

## Rollback

If deployment fails, you can quickly rollback to the previous version:

```bash
ssh ubuntu@158.178.130.4
cd /opt/cybercom/platform

# View git history (if using git)
git log --oneline

# Checkout previous commit
git checkout <previous-commit>

# Restart services
docker-compose down
docker-compose up -d
```

## Security Best Practices

1. **Rotate Secrets Regularly**
   - Update `JWT_SECRET`, `POSTGRES_PASSWORD`, `REDIS_PASSWORD` quarterly
   - Regenerate `SSH_PRIVATE_KEY` annually

2. **Limit SSH Access**
   - Use security rules to restrict SSH to specific IPs
   - Consider using Bastion host for production access

3. **Secure Nginx**
   - Ensure SSL/TLS is enforced (certbot already configured)
   - Update Nginx regularly: `docker pull nginx:1.27-alpine`

4. **Database Security**
   - Use strong passwords (already enforced via random generation)
   - Restrict PostgreSQL to internal network only
   - Enable SSL for database connections

5. **Monitor Deployments**
   - Review GitHub Actions logs after each deployment
   - Set up email alerts for failed deployments
   - Monitor application metrics and logs regularly

## Additional Resources

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Docker Compose Reference](https://docs.docker.com/compose/compose-file/)
- [Certbot Documentation](https://certbot.eff.org/docs/)
- [OCI VM Documentation](https://docs.oracle.com/en-us/iaas/Content/Compute/home.htm)
- [Nginx Documentation](https://nginx.org/en/docs/)
