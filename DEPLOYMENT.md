# VPS Deployment

This project can deploy automatically to a VPS whenever `main` is pushed.

## One-Time VPS Setup

SSH into the VPS and install the runtime tools if they are not already installed:

```bash
npm install -g pm2
```

Clone the repository into the app directory:

```bash
sudo mkdir -p /var/www/menue-yalli
sudo chown -R "$USER":"$USER" /var/www/menue-yalli
git clone https://github.com/Nikhilgb-dev/Menue-yalli.git /var/www/menue-yalli
cd /var/www/menue-yalli
chmod +x scripts/deploy-vps.sh
```

Create the production `.env` file in the repo root on the VPS:

```bash
nano .env
```

Then run the first deploy manually:

```bash
APP_DIR=/var/www/menue-yalli BRANCH=main bash scripts/deploy-vps.sh
```

## GitHub Secrets

Add these in GitHub:

- `VPS_HOST`: server IP or hostname
- `VPS_USER`: SSH username
- `VPS_SSH_KEY`: private SSH key with access to the VPS
- `VPS_PORT`: SSH port, usually `22`
- `VPS_APP_DIR`: app path on the VPS, for example `/var/www/menue-yalli`

After that, every push to `main` will run `.github/workflows/deploy-vps.yml`.

## What Deployment Does

The script:

- Fetches the latest `main`
- Resets the VPS checkout to `origin/main`
- Installs root, client, and server dependencies with `npm ci`
- Builds the Vite client into `client/dist`
- Starts or restarts the Express API with PM2
- Saves the PM2 process list

The Express server serves the built frontend when `client/dist/index.html` exists.
