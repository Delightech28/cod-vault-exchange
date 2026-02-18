# Serverless API on Vercel

This `api/` directory contains serverless functions for your MongoDB-backed API.

## Setup

1. **Set environment variables in Vercel:**
   - `MONGODB_URI`: Your MongoDB Atlas connection string

2. **Endpoints available:**
   - `POST /api/auth/signup` — create user
   - `POST /api/auth/login` — authenticate
   - `GET /api/auth/user` — get current user (requires Bearer token)
   - `GET /api/api/[collection]` — list collection docs
   - `POST /api/api/[collection]` — create doc
   - `GET /api/api/[collection]/[id]` — get doc by id
   - `PUT /api/api/[collection]/[id]` — update doc
   - `DELETE /api/api/[collection]/[id]` — delete doc

## Local Testing

Run the server in `server/` directory for local development:

```bash
cd server
npm install
npm run dev
```

Then set `VITE_API_URL=http://localhost:4000` in your `.env` and start the frontend.

## Deployment

Push to GitHub and connect to Vercel:
1. Go to [vercel.com](https://vercel.com)
2. Import this repository
3. Set `MONGODB_URI` environment variable
4. Deploy

Once deployed, your API URL will be: `https://your-vercel-url.vercel.app/api`

Update `.env` in frontend:

```
VITE_API_URL=https://your-vercel-url.vercel.app/api
```

Then redeploy the frontend.
