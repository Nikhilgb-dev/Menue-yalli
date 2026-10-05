#!/usr/bin/env bash
set -euo pipefail

APP_DIR="${APP_DIR:-/var/www/menue-yalli}"
BRANCH="${BRANCH:-main}"
PM2_APP_NAME="${PM2_APP_NAME:-menue-yalli-api}"

cd "$APP_DIR"

echo "Deploying $APP_DIR from branch $BRANCH"

git fetch origin "$BRANCH"
git reset --hard "origin/$BRANCH"

npm ci
npm ci --prefix client
npm ci --prefix server

npm run build --prefix client

if pm2 describe "$PM2_APP_NAME" >/dev/null 2>&1; then
  pm2 restart "$PM2_APP_NAME" --update-env
else
  pm2 start ecosystem.config.cjs --only "$PM2_APP_NAME"
fi

pm2 save

echo "Deployment complete."
