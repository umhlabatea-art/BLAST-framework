# Deploying Umhlawati / BLAST

The BLAST backend serves both the API and the static frontend, so the whole app
ships as a single container. Two supported paths:

## Option A — Full stack with Docker Compose (recommended)

Brings up PostgreSQL and the app together:

```bash
docker compose up --build
# open http://localhost:3000
```

The API connects to the bundled Postgres, applies the schema on startup, and
serves the frontend. Override these env vars in `docker-compose.yml` for
production:

- `AUTH_SECRET` — set a long random value (do **not** ship the default).
- `STRIPE_SECRET_KEY` + `STRIPE_WEBHOOK_SECRET` — for live payments (also add
  `stripe` to `src/backend` dependencies so the package is installed).
- `APP_URL` — the public URL of the app (used in Stripe redirect URLs).

### Build just the image

```bash
docker build -t umhlawati-blast .
docker run -p 3000:3000 -e AUTH_SECRET=$(openssl rand -hex 32) umhlawati-blast
```

## Option B — Split: frontend on Vercel, API on a host

1. **API** — deploy the container (Option A image) to any host that runs
   containers (Fly.io, Railway, Render, ECS, a VPS). Point `DATABASE_URL` at a
   managed Postgres or **Supabase** connection string. Set `AUTH_SECRET` and,
   for payments, the Stripe vars.

2. **Frontend** — deploy `src/frontend` to Vercel. `vercel.json` is configured
   to serve that directory statically and proxy `/api/*` to your API host:

   ```jsonc
   // vercel.json — replace the placeholder with your API's public host
   "destination": "https://YOUR-API-HOST/api/$1"
   ```

   With that rewrite in place the frontend's relative `/api` calls reach the
   deployed backend.

## Option C — Managed cloud (Fly.io or Render)

Config files are included for one-command deploys.

### Fly.io (`fly.toml`)

```bash
fly launch --no-deploy --copy-config --name umhlawati-blast
fly postgres create --name umhlawati-db
fly postgres attach umhlawati-db          # injects DATABASE_URL
fly secrets set AUTH_SECRET=$(openssl rand -hex 32)
# optional live payments:
fly secrets set STRIPE_SECRET_KEY=sk_live_... STRIPE_WEBHOOK_SECRET=whsec_...
fly deploy
```

Fly builds the `Dockerfile`, attaches managed Postgres, and the app applies the
schema on first boot. Your app is then live at `https://umhlawati-blast.fly.dev`.

### Render (`render.yaml`)

Push the repo, then in the Render dashboard choose **New → Blueprint** and select
this repo (or use the Render CLI). The blueprint provisions a Dockerized web
service **plus a managed PostgreSQL database**, generates `AUTH_SECRET`, and
wires `DATABASE_URL` automatically. Set `APP_URL` to the assigned URL after the
first deploy.

## Database

- Local/dev: omit `DATABASE_URL` to use the in-memory store (no DB needed).
- Production: set `DATABASE_URL`. The schema (`src/backend/schema.sql`) is
  applied automatically on startup. For Supabase use the connection string from
  Project Settings → Database; SSL is enabled by default (`PGSSL=disable` only
  for a local DB without SSL).

## CI

`.github/workflows/ci.yml` runs every test suite on push and PR. A pre-commit
hook (`npm run setup:hooks`) runs them locally before each commit.
