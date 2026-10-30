# OneAgent

**One workspace. Multiple AI capabilities. One streamlined workflow.**

OneAgent is an AI-powered workspace that brings specialized AI
capabilities---such as coding, research, and writing---into one
interface. The application uses a Next.js frontend and a FastAPI
backend, with provider adapters handling requests to supported AI
services.

## Features

-   **Unified workspace:** Access supported AI capabilities from one
    application.
-   **Task orchestration:** Route user requests through the backend
    orchestration layer.
-   **AI provider integration:** Connect to supported model providers
    through backend adapters.
-   **Conversation history:** Create conversations, retrieve
    conversation messages, and continue previous chats.
-   **Task history:** Browse task records with pagination and retrieve
    an individual task directly.
-   **Usage summary:** Retrieve user-scoped usage aggregates without
    downloading full task and workflow histories.
-   **Markdown rendering:** Render formatted responses, including
    tables, lists, code blocks, and mathematical notation.
-   **Authentication:** Supabase Auth integration.
-   **Persistent data:** Supabase PostgreSQL database accessed through
    SQLAlchemy and Alembic migrations.

> Availability of individual AI capabilities depends on the providers,
> models, credentials, and configuration enabled in the backend.

## Architecture

``` text
User
  |
  v
Next.js / React frontend
  |
  | HTTP API requests
  v
FastAPI backend
  |
  +--> Authentication and user-scoped access
  |
  +--> Request orchestration
  |       |
  |       +--> AI provider adapters
  |
  +--> Conversation and task services
  |
  +--> SQLAlchemy
          |
          v
     Supabase PostgreSQL
```

### Technology stack

  Layer              Technologies
  ------------------ -------------------------------------------------
  Frontend           Next.js, React, TypeScript, Tailwind CSS
  Backend            Python, FastAPI
  AI integration     Provider adapters and API-based model inference
  Database           Supabase PostgreSQL, SQLAlchemy
  Migrations         Alembic
  Authentication     Supabase Auth
  Frontend hosting   Vercel
  Backend hosting    Render

## Repository structure

The project is organized into separate frontend and backend
applications:

``` text
OneAgent/
├── frontend/       # Next.js application
└── backend/        # FastAPI application
```

The backend contains the API, database models and repositories,
migrations, and AI provider integrations. The frontend contains the
workspace UI, conversation experience, and response rendering
components.

## Prerequisites

Install the following before running the project locally:

-   Node.js and npm
-   Python (use a version compatible with the backend dependencies)
-   Git
-   Access to the required Supabase project
-   API credentials for whichever AI providers you intend to enable

## Run locally

### 1. Clone the repository

``` bash
git clone <YOUR_GITHUB_REPOSITORY_URL>
cd OneAgent
```

Replace the placeholder with your repository URL.

### 2. Configure the backend

``` powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

Create the backend `.env` file using the variable names expected by the
backend configuration. Set the database, authentication, and AI-provider
configuration required by your setup. **Do not commit `.env` or expose
API keys.**

Start the API:

``` powershell
uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```

Backend base URL:

``` text
http://127.0.0.1:8000
```

Interactive API documentation:

``` text
http://127.0.0.1:8000/docs
```

### 3. Configure the frontend

Open a second terminal:

``` powershell
cd frontend
npm install
```

Configure the frontend environment using the variable names expected by
the frontend. For local development, ensure its API base URL points to:

``` text
http://127.0.0.1:8000
```

Start the frontend:

``` powershell
npm run dev
```

Open:

``` text
http://localhost:3000
```

To stop either development server, press `Ctrl+C` in its terminal.

## Database migrations

The backend uses Alembic to manage schema changes. Run migration
commands from the `backend` directory with the virtual environment
activated and the database configuration loaded:

``` powershell
alembic upgrade head
```

Check the current migration revision:

``` powershell
alembic current
```

Do not edit an already-applied migration to introduce a new schema
change. Create a new migration instead.

## Deployment

The production deployment is split between Vercel and Render:

  Component     Hosting platform
  ------------- ------------------
  Frontend      Vercel
  Backend API   Render

Configure each hosting service to track the intended GitHub repository
and branch. For the backend service, verify its root directory, build
command, start command, environment variables, and database connectivity
in Render.

### Automatic Render deployments

Enable **Auto-Deploy** in the Render Web Service settings and select the
deployment branch (for example, `main`). Once configured, pushing a new
commit to that branch can trigger a deployment automatically.

A local commit does not trigger a deployment; the commit must be pushed
to GitHub.

The frontend can be configured similarly through Vercel's Git
integration.

## API capabilities

The backend includes endpoints for core workspace data operations,
including:

-   Conversation creation, listing, and retrieval.
-   Conversation message retrieval.
-   Paginated task listing.
-   Individual task retrieval.
-   User-scoped usage summaries.

For the current endpoint definitions and request/response schemas, use
the running FastAPI documentation at `/docs`.

## Performance considerations

The application uses bounded and user-scoped data retrieval for
frequently accessed workspace information. Task history supports
pagination, individual task details can be fetched directly, and usage
summaries are aggregated by the backend. Database indexes support common
user-and-timestamp queries for tasks and workflows.

## Security notes

-   Keep API keys, database credentials, and Supabase secrets in
    environment variables or the hosting provider's secret
    configuration.
-   Never commit `.env` files, access tokens, or private keys.
-   Enforce user ownership checks for user-specific conversations,
    tasks, and workflows.
-   Use HTTPS for deployed frontend and backend communication.
-   Rotate credentials immediately if they are accidentally exposed.

## Troubleshooting

### Frontend cannot reach the backend

-   Confirm that the backend is running.
-   Check the frontend API base URL.
-   For local development, verify that it points to
    `http://127.0.0.1:8000`.
-   Check browser and backend logs for CORS or network errors.

### Backend fails to start

-   Activate the backend virtual environment.
-   Install the backend dependencies.
-   Verify the required environment configuration.
-   Check the Uvicorn traceback for the underlying error.

### AI provider request fails

-   Verify that the provider is enabled and configured.
-   Confirm that the model identifier and API endpoint are valid for
    that provider.
-   Check provider response status, backend logs, and timeout settings.
-   Do not expose API credentials when sharing logs.

### Render does not deploy after a push

-   Confirm that the latest commit was pushed to GitHub.
-   Verify that Render is connected to the correct repository and
    branch.
-   Check that Auto-Deploy is enabled.
-   Review the Render Events and Deploys logs for build or startup
    failures.

## Development workflow

``` bash
git status
git add <files>
git commit -m "Describe the change"
git push origin main
```

Review staged changes before committing, and avoid staging local secrets
or unrelated experimental files.

## Project status

OneAgent is an actively developed project. Features and provider
availability may change as integrations and workflows evolve. Refer to
the current source code and deployment configuration for the definitive
implementation details.

## License

Add the project's chosen license here before distributing or accepting
external contributions.
