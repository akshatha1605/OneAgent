# OneAgent Deployment Guide

This guide deploys the existing application with:

- Frontend: Vercel
- Backend: Render
- Database: Supabase PostgreSQL
- Authentication: Supabase Auth

No deployment or production migration is performed by this repository tooling.

## 1. Supabase setup

1. Create or select a Supabase project.
2. In **Project Settings -> Database**, copy the pooled or direct PostgreSQL connection string.
3. Use the connection string only as the backend `DATABASE_URL`; never add it to frontend variables.
4. In **Authentication -> URL Configuration**, set:
   - Site URL: `https://one-agent-ai.vercel.com`
   - Redirect URL: `https://one-agent-ai.vercel.com/auth/callback`
   - Keep `http://localhost:3000/auth/callback` for local development if needed.
5. Copy the Supabase project URL and anon/public key for both backend verification and frontend authentication.

## 2. Backend environment variables on Render

Required secrets:

```text
DATABASE_URL=postgresql://...
SUPABASE_URL=https://<project>.supabase.co
SUPABASE_ANON_KEY=<supabase-anon-key>
API_KEY_ENCRYPTION_KEY=<stable-fernet-key>
```

Optional provider secrets:

```text
OPENAI_API_KEY=
GEMINI_API_KEY=
GROQ_API_KEY=
XAI_API_KEY=
TAVILY_API_KEY=
```

Application configuration:

```text
CORS_ALLOWED_ORIGINS=https://one-agent-ai.vercel.com
DB_POOL_SIZE=5
DB_MAX_OVERFLOW=5
DB_POOL_TIMEOUT=30
DB_POOL_RECYCLE=1800
PROVIDER_TIMEOUT_SECONDS=45
PORT=<provided by Render>
```

`API_KEY_ENCRYPTION_KEY` must remain unchanged after deployment. Changing it
makes previously stored provider keys undecryptable. Generate a Fernet key
with:

```powershell
python -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"
```

Do not log or commit the generated value.

## 3. Render deployment

The repository includes [`render.yaml`](./render.yaml). The equivalent
commands are:

```text
Build: pip install -r requirements.txt
Start: alembic upgrade head && uvicorn app.main:app --host 0.0.0.0 --port $PORT
Health check: /api/health/live
Root directory: backend
```

Render's PostgreSQL connection string must be set as `DATABASE_URL`.
Alembic runs before the web process starts. The application does not run
`create_all()` or ALTER-table compatibility migrations against PostgreSQL.

## 4. Frontend environment variables on Vercel

Set these variables for Production, Preview, and Development as appropriate:

```text
NEXT_PUBLIC_API_URL=https://<render-service>.onrender.com
NEXT_PUBLIC_SUPABASE_URL=https://<project>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<supabase-anon-key>
```

Only variables beginning with `NEXT_PUBLIC_` are sent to the browser. Never
put `DATABASE_URL`, provider keys, or `API_KEY_ENCRYPTION_KEY` in Vercel
frontend variables.

The frontend retains `http://localhost:8000` as a development fallback when
`NEXT_PUBLIC_API_URL` is absent. Production must set the variable explicitly.

## 5. PostgreSQL schema migration

For a new Supabase database:

```powershell
Set-Location F:\OneAgent\backend
$env:DATABASE_URL = "<supabase-postgres-url>"
alembic upgrade head
```

The initial migration creates:

- conversations
- messages
- tasks
- executions
- results
- workflows
- workflow_steps
- user_api_keys
- rate_limit_buckets

Inspect the migration before applying it. Do not run `alembic downgrade` in
production without a tested backup and rollback plan.

### Migrating an existing local SQLite database

1. Make a file backup of `oneagent.db`.
2. Create the target Supabase database and run `alembic upgrade head`.
3. Run a dry run:

```powershell
Set-Location F:\OneAgent\backend
python scripts\migrate_sqlite_to_postgres.py `
  --source ..\oneagent.db `
  --target "<supabase-postgres-url>"
```

4. Compare the reported counts with the SQLite backup.
5. Run the copy only after review:

```powershell
python scripts\migrate_sqlite_to_postgres.py `
  --source ..\oneagent.db `
  --target "<supabase-postgres-url>" `
  --apply
```

The script does not delete or overwrite target rows and is intended for a
fresh target database. Do not run it repeatedly without reviewing duplicate
key behavior.

## 6. Health and smoke tests

After Render starts:

```powershell
Invoke-WebRequest https://<render-service>.onrender.com/api/health/live
Invoke-WebRequest https://<render-service>.onrender.com/api/health/ready
```

Expected:

- `/api/health/live`: process is alive.
- `/api/health/ready`: database, Supabase configuration, and encryption
  configuration are available.

These endpoints do not perform provider calls and do not claim that OpenAI,
Gemini, Groq, Grok, or Tavily are healthy.

Then open `https://one-agent-ai.vercel.com`, sign in through Supabase, create
a conversation, and verify a protected API request. Use authorized test
accounts for cross-user isolation checks.

## 7. Rollback

1. Stop or roll back the Render service to the previous deploy.
2. Do not change `API_KEY_ENCRYPTION_KEY`.
3. Restore the database from a Supabase backup if a migration must be rolled
   back.
4. Revert the Vercel deployment to the previous known-good deployment.
5. Keep the failed migration and request IDs in the incident record.

Never delete the existing SQLite database as part of deployment.

## 8. Required manual verification

This repository cannot verify without deployment credentials:

- Render startup against Supabase PostgreSQL.
- Vercel-to-Render CORS connectivity.
- Supabase login and callback in the production domain.
- Live provider calls.
- Production database persistence and backups.
