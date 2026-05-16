# QR Menu Platform

Multi-tenant menu platform for food carts, hotels, cafes, and restaurants.

## What it does

- Owners sign up and log in
- Each owner gets a private dashboard
- Owners upload menu items with image, description, price, and availability
- Each owner gets a unique public menu page and downloadable QR code
- Scanning one owner's QR opens only that owner's menu
- Owners can add review and social links that appear on the public menu page

## Project structure

- `client/`: React + Vite frontend
- `server/`: Express + MongoDB API

## Run locally

1. Install dependencies:
   - `npm install`
   - `npm install --prefix client`
   - `npm install --prefix server`
2. Configure environment in the repo root `.env`
3. Start both apps:
   - `npm run dev`

Frontend runs on `http://localhost:5173`.
Backend runs on `http://localhost:5001`.

## Environment

Use a root `.env` file:

```env
PORT=5001
MONGO_URI=your_mongodb_connection_string
CLIENT_URL=http://localhost:5173
PUBLIC_APP_URL=http://localhost:5173
JWT_SECRET=replace-this-in-production
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
CLOUDINARY_FOLDER=menu-platform
```

## Main routes

- `POST /api/auth/signup`
- `POST /api/auth/login`
- `GET /api/dashboard`
- `PUT /api/dashboard/profile`
- `DELETE /api/dashboard/account`
- `POST /api/dashboard/menu-items`
- `DELETE /api/dashboard/menu-items/:itemId`
- `GET /api/public/:slug`
- `GET /api/public/:slug/qr`

## Notes

- Uploaded images are stored in Cloudinary, not on the local filesystem
- MongoDB is required for the platform flow
- The dashboard expects bearer-token auth using the JWT returned from signup/login
