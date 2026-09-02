# CEO AI Thailand Marketing OS — Docker Runbook

This container baseline exists to make the Marketing OS runtime repeatable across developer machines and CI. It is for local/test validation only until a separate production release is explicitly authorized.

## What is pinned by the image

- Node.js major runtime: Node 20
- Application source and dependency installation happen inside the image
- `npm run typecheck` and `npm run build` must pass during image build
- Runtime listens on container port `3000`
- Container health is checked through `http://127.0.0.1:3000`

## Build locally

From `apps/marketing-os`:

```bash
docker build -t ceo-ai-marketing-os:local .
```

## Run locally

```bash
docker run --rm \
  -p 3000:3000 \
  --env-file .env.local \
  ceo-ai-marketing-os:local
```

Then open `http://localhost:3000`.

## Docker Compose

Only public Supabase client variables are passed by `compose.yaml` by default.

```bash
docker compose --env-file .env.local up --build
```

Stop and remove the local container with:

```bash
docker compose down
```

## Secret boundary

Never bake `.env`, `.env.local`, `SUPABASE_SERVICE_ROLE_KEY`, or `OPENAI_API_KEY` into an image. `.dockerignore` excludes local environment files. Service-role credentials must not be used for normal tenant CRUD and must never be exposed to browser code.

## Data and volumes

The Marketing OS container is intentionally stateless. Supabase owns persistent application data, so this app container does not define a database volume. Disposable local Supabase used by CI remains separate from this application image.

## Current reproducibility gap

The app currently has no committed `package-lock.json`, so dependency resolution can still drift within semver ranges even though the runtime is containerized. A committed lockfile plus `npm ci` should be the next dependency-reproducibility hardening step after compatibility is verified.

## Production safety

Building this image does **not** authorize production deployment. Do not push it to production, mutate remote production Supabase, run production migrations/SQL, or merge `main` without the separate release gate and owner authorization.
