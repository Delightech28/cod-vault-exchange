# cod-vault-server

Minimal Express server for replacing Supabase with MongoDB.

Quick start

```bash
cd server
npm install
cp .env.example .env
# edit .env to set MONGODB_URI if needed
npm run dev
```

The server exposes:
- `POST /auth/login` — body `{ email, name }` returns `{ token, user }`
- `GET /auth/user` — requires `Authorization: Bearer <token>`
- Generic REST: `GET/POST/PUT/DELETE /api/:collection` (simple filters via query params)
- `POST /functions/:name` — placeholder for server functions

Migration

To migrate data from Supabase to MongoDB using the included script:

1. Install server deps and set env:

```bash
cd server
npm install
cp .env.example .env
# set POSTGRES_URL (your Postgres connection string) and MONGODB_URI if needed
```

2. Run migration for specific tables (comma-separated):

```bash
MIGRATE_TABLES=profiles,listings POSTGRES_URL=postgres://user:pass@host:5432/db MONGODB_URI=mongodb://localhost:27017/cod-vault node scripts/migrate_supabase_to_mongo.js
```

Notes:
- The script now uses `POSTGRES_URL` to pull data directly from Postgres and write into MongoDB.
- After migration, update frontend and port server-side functions as needed.
