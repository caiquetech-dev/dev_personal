# Junyong Lee CV

Next.js CV page with a token-protected admin editor.

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

The public CV is available at `/`. The admin editor is available at:

```text
/admin?token=YOUR_ADMIN_TOKEN
```

## Resume Data

The bundled fallback resume data lives at:

```text
data/resume-content.json
```

In production, the app reads resume data in this order:

1. Postgres database row `resume_content.active`
2. GitHub Contents API JSON
3. Bundled fallback JSON

Admin saves write to the configured database and GitHub JSON. If only one store is configured, saves use that store.

## Environment Variables

Set these in Vercel:

```bash
ADMIN_TOKEN=your-private-admin-url-token
DATABASE_URL=postgres-connection-string
GITHUB_TOKEN=github-fine-grained-token-with-contents-read-write
GITHUB_REPO=owner/repo
GITHUB_BRANCH=main
GITHUB_RESUME_PATH=kevin_CV/data/resume-content.json
```

`GITHUB_BRANCH` and `GITHUB_RESUME_PATH` have the defaults shown above. `POSTGRES_URL` and `POSTGRES_PRISMA_URL` are also accepted when `DATABASE_URL` is not set.

The database table is created automatically on first read/write:

```sql
CREATE TABLE IF NOT EXISTS resume_content (
  id text PRIMARY KEY,
  content jsonb NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);
```

## Checks

```bash
npm run lint
npm run build
```
