# OneAgent — Intelligent Multi-Agent Orchestration Platform

**An Open Source Technology (OST) Project**

OneAgent is an intelligent multi-agent orchestration platform that accepts tasks through a unified interface, analyzes user intent, and routes requests to specialized AI agents. Instead of requiring users to select an agent manually, OneAgent determines the appropriate capability for a task and coordinates its execution through a centralized orchestrator.

The project aims to simplify interaction with multiple AI capabilities through a single, extensible interface.
---
## Table of Contents
- [Overview](#overview)
- [Problem Statement](#problem-statement)
- [Objectives](#objectives)
- [Key Features](#key-features)
- [System Architecture](#system-architecture)
- [Technology Stack](#technology-stack)
- [Project Structure](#project-structure)
- [Prerequisites](#prerequisites)
- [Installation and Setup](#installation-and-setup)
- [Environment Configuration](#environment-configuration)
- [Running the Application](#running-the-application)
- [API Documentation](#api-documentation)
- [How It Works](#how-it-works)
- [Extensibility](#extensibility)
- [Testing and Troubleshooting](#testing-and-troubleshooting)
- [Future Enhancements](#future-enhancements)
- [Contributing](#contributing)
- [License](#license)
- [Acknowledgements](#acknowledgements)

---

## Overview

Modern AI applications often provide separate interfaces for different tasks, such as coding, writing, document processing, and research. Users may need to determine which tool is appropriate before they can accomplish their objectives.

OneAgent addresses this problem by introducing an orchestration layer that intelligently connects user requests to specialized agents.

The platform follows the principle:

**One Interface → Intelligent Orchestration → Specialized Capabilities**

Users submit tasks through a central interface. The orchestrator analyzes each request, evaluates relevant capabilities, selects an appropriate agent, and returns a standardized result.

OneAgent is designed with modularity and extensibility in mind, allowing additional agents and model providers to be integrated as the platform evolves.

## Problem Statement

Traditional AI tools frequently separate capabilities into individual applications or workflows. This creates several challenges:

- Users must identify the appropriate tool for each task.
- Switching between different AI capabilities can interrupt the workflow.
- Integrating new capabilities into a single application can become difficult as the system grows.
- Inconsistent response formats make results harder to process and display.
- Rigid, keyword-based routing may fail to understand the actual intent of a request.

OneAgent aims to address these limitations through centralized orchestration, semantic task analysis, capability-based routing, and a modular agent architecture.

## Objectives

1. Develop a unified interface for submitting diverse user tasks.
2. Analyze task intent using semantic representations.
3. Route tasks to suitable specialized agents.
4. Integrate configurable AI model providers.
5. Support research-oriented tasks through search integration.
6. Standardize agent execution results for consistent presentation.
7. Maintain a modular architecture that supports adding or removing agents.
8. Provide a foundation for future improvements in reliability, observability, and scalability.

## Key Features

### 1. Centralized Task Orchestration
A single orchestrator coordinates task analysis, agent selection, execution, and result handling.

### 2. Semantic Task Analysis
The task analyzer uses sentence embeddings to represent requests semantically, helping the system identify relevant agent capabilities beyond simple keyword matching.

### 3. Specialized AI Agents
The architecture includes dedicated agents for different categories of work, including:

- **Coding Agent:** Programming-related assistance.
- **Research Agent:** Research-oriented queries and information gathering.
- **Writing Agent:** Content creation and writing assistance.
- **Document Agent:** Document-related processing tasks.

Actual supported operations depend on each agent's implementation and configured services.

### 4. Model Provider Integration
The backend uses an adapter-based design for integrating supported language model providers. Configured providers can be used by agents without requiring the entire application to depend on one provider.

### 5. Research and Search Integration
Search integration supports research workflows by allowing compatible components to retrieve external information when configured.

### 6. Standardized Results
Agent responses follow a common result structure, making it easier for the backend and frontend to handle execution status, output, and metadata consistently.

### 7. Database Integration
The backend includes database models for tasks, executions, and results, supporting persistence of orchestration activity.

### 8. Modular Architecture
Agents, task analysis, model adapters, and search integrations are separated into components to make maintenance and future extensions easier.

### 9. Web-Based Interface
The frontend provides a central workspace for submitting tasks and viewing results without requiring users to choose a specialized agent manually.

---

## System Architecture

OneAgent follows a modular architecture consisting of a frontend, backend API, orchestration layer, specialized agents, external service adapters, and database.

```text
              +-------------------------+
              |       User Interface    |
              |      Next.js Frontend  |
              +------------+------------+
                           |
                           v
              +-------------------------+
              |      FastAPI Backend    |
              |       REST API          |
              +------------+------------+
                           |
                           v
              +-------------------------+
              |       Orchestrator      |
              | Task Validation         |
              | Routing and Coordination|
              +------------+------------+
                           |
                           v
              +-------------------------+
              |      Task Analyzer      |
              | Semantic Analysis       |
              | Capability Matching     |
              +------------+------------+
                           |
                           v
              +-------------------------+
              |     Agent Registry      |
              |  Agent Selection        |
              +------------+------------+
                           |
             +-------------+-------------+
             |             |             |
             v             v             v
       +-----------+ +-----------+ +-----------+
       |  Coding   | | Research  | | Writing / |
       |   Agent   | |   Agent   | | Document  |
       +-----+-----+ +-----+-----+ +-----+-----+
             |             |             |
             +-------------+-------------+
                           |
                           v
              +-------------------------+
              | Model and Search Adapters|
              | Configured AI Providers |
              | External Search Service |
              +------------+------------+
                           |
                           v
              +-------------------------+
              | Result Standardization  |
              | Database Persistence    |
              +------------+------------+
                           |
                           v
              +-------------------------+
              | Response to Frontend    |
              +-------------------------+
```

The diagram illustrates the logical architecture. Exact execution paths depend on the task, selected agent, and available integrations.

## Technology Stack

| Component | Technology |
|---|---|
| Frontend | Next.js, React, TypeScript |
| Backend API | Python, FastAPI |
| ASGI Server | Uvicorn |
| Data Validation | Pydantic |
| Semantic Task Analysis | Sentence Transformers |
| Embedding Model | `all-MiniLM-L6-v2` |
| Language Model Integration | Provider adapters |
| AI Providers | Supported and configured providers such as Gemini and Groq |
| Search Integration | Tavily adapter |
| Database Layer | SQLAlchemy |
| Configuration | Environment variables and `.env` |
| Version Control | Git and GitHub |
| License | MIT License |

*The availability of individual AI and search services depends on configuration, valid credentials, provider availability, and the implementation of the relevant agent.*

---

## Project Structure

The repository is organized into separate frontend and backend components.

```text
OneAgent/
├── backend/
│   ├── app/
│   │   ├── main.py
│   │   ├── orchestrator.py
│   │   ├── analyzer/
│   │   │   └── task_analyzer.py
│   │   ├── agents/
│   │   │   ├── base_agent.py
│   │   │   ├── coding_agent.py
│   │   │   ├── document_agent.py
│   │   │   ├── research_agent.py
│   │   │   ├── writing_agent.py
│   │   │   └── registry.py
│   │   ├── models/
│   │   │   ├── model_adapter.py
│   │   │   ├── gemini_adapter.py
│   │   │   └── groq_adapter.py
│   │   └── search/
│   │       └── tavily_adapter.py
│   ├── requirements.txt
│   └── .env.example
│
├── frontend/
│   ├── app/ or src/
│   ├── components/
│   ├── public/
│   ├── package.json
│   └── ...
│
├── .gitignore
├── LICENSE
└── README.md
```

*Note: The tree highlights the main architectural components. Some files and directories may differ in the current repository. Refer to the actual repository for the complete structure.*

---

## Prerequisites

Ensure that the following tools are installed:

- Python 3.11 or another version compatible with the project's dependencies.
- Node.js and npm compatible with the frontend dependencies.
- Git.
- A code editor such as Visual Studio Code.
- API credentials for any external services you intend to use.

Internet connectivity may be required for installing dependencies, downloading the embedding model, and accessing configured external services.

## Installation and Setup

### 1. Clone the Repository

```bash
git clone https://github.com/akshatha1605/OneAgent.git
cd OneAgent
```

### 2. Set Up the Backend

Navigate to the backend directory:

```bash
cd backend
```

Create a Python virtual environment:

**Windows PowerShell**

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
```

**Linux or macOS**

```bash
python3 -m venv .venv
source .venv/bin/activate
```

Install the required Python packages:

```bash
python -m pip install --upgrade pip
pip install -r requirements.txt
```

If the repository uses a different dependency file or setup process, follow the instructions provided by that configuration.

### 3. Configure Backend Environment Variables

Create a `.env` file inside the backend directory, using the repository's `.env.example` as a reference if available.

```env
# Add only the variables supported by your backend configuration.
# Example provider credentials:
GEMINI_API_KEY=your_gemini_api_key
GROQ_API_KEY=your_groq_api_key
TAVILY_API_KEY=your_tavily_api_key
```

Use valid credentials for the services you intend to enable. Variable names must match those read by the application's configuration and adapter code.

Do not commit the `.env` file or expose API keys in public repositories.

### 4. Set Up the Frontend

Open a second terminal from the repository root:

```bash
cd frontend
npm install
```

Configure any frontend environment variables required by the application. Consult the frontend configuration and existing environment examples rather than assuming variable names.

---

## Running the Application

The backend and frontend must run in separate terminals during local development.

### Terminal 1: Start the Backend

From the `backend` directory, activate the virtual environment if necessary and run:

```bash
python -m uvicorn app.main:app --reload --port 8000
```

The backend should be available at:

- **Base URL:** http://127.0.0.1:8000
- **Interactive API documentation:** http://127.0.0.1:8000/docs
- **Alternative API documentation:** http://127.0.0.1:8000/redoc

The documentation endpoints are provided by FastAPI when enabled in the application configuration.

### Terminal 2: Start the Frontend

From the `frontend` directory:

```bash
npm run dev
```

Open the local URL printed by the frontend development server, commonly:

http://localhost:3000

Keep both terminals running while using the application.

If the frontend cannot communicate with the backend, verify the backend URL and the CORS configuration in the FastAPI application.

---

## API Documentation

OneAgent exposes its backend functionality through a FastAPI application.

### Orchestration Endpoint

**Endpoint:** `POST /api/orchestrate`

**Purpose:** Submit a task for analysis, agent selection, and execution.

Example request:

```http
POST http://127.0.0.1:8000/api/orchestrate
Content-Type: application/json
```

Request body:

```json
{
  "task": "Explain the difference between TCP and UDP"
}
```

Example using `curl`:

```bash
curl -X POST http://127.0.0.1:8000/api/orchestrate \
  -H "Content-Type: application/json" \
  -d "{\"task\":\"Explain the difference between TCP and UDP\"}"
```

The response may include information about task analysis, routing, the selected agent, model or search usage, and the generated result. Exact fields depend on the current backend implementation.

### Retrieve Recent Tasks

**Endpoint:** `GET /api/tasks`

**Purpose:** Retrieve task records saved by the backend.

Example:

```bash
curl http://127.0.0.1:8000/api/tasks
```

For the complete request and response schemas, open the interactive API documentation after starting the backend.

---

## How It Works

A typical task passes through the following stages.

### Step 1: Task Submission
The user submits a natural-language request through the central frontend workspace.

### Step 2: Request Validation
The backend validates the incoming request and checks that the task contains usable input.

### Step 3: Semantic Task Analysis
The task analyzer converts the request into an embedding representation and evaluates its relevance to the available agent capabilities.

### Step 4: Agent Selection
The orchestrator uses the analysis and agent registry to select an appropriate implementation. Confidence and capability checks help determine whether a candidate agent is suitable.

### Step 5: Agent Execution
The selected agent processes the task using its implemented logic and any configured model or search integrations.

### Step 6: Result Standardization
The result is converted into the common response structure expected by the rest of the application.

### Step 7: Persistence
Where configured by the execution path, task and result information is stored through the database layer.

### Step 8: Response Delivery
The backend returns the response to the frontend for presentation to the user.

---

## Extensibility

OneAgent is designed to support the integration of additional agents and services.

### Adding a Specialized Agent

A new agent can generally be integrated by:

1. Creating an agent implementation that follows the project's base-agent interface.
2. Defining the tasks and capabilities supported by that agent.
3. Registering the agent in the agent registry.
4. Integrating it with the orchestrator's capability-matching process.
5. Implementing its required model or external service integrations.
6. Testing successful execution, invalid inputs, and unavailable-service scenarios.

The exact steps depend on the current agent registry and interface contracts.

### Adding a Model Provider

The adapter pattern provides a common interface for model integrations. A compatible provider can be added by implementing the expected adapter methods and configuring its credentials through environment variables.

This separation helps reduce provider-specific dependencies within the orchestrator and agent implementations.

---

## Testing and Troubleshooting

### Backend Does Not Start

- Confirm that the virtual environment is activated.
- Install the dependencies listed in `requirements.txt`.
- Verify that the command is executed from the `backend` directory.
- Check the terminal output for import errors and configuration problems.

### Frontend Dependency Errors

- Run `npm install` inside `frontend`.
- Verify that the Node.js version is compatible with the project.
- Restart the TypeScript server in Visual Studio Code if stale diagnostics remain.

### AI Provider Errors

- Confirm that the required API key is configured.
- Verify that the configured model identifier is supported by the provider.
- Check provider availability, quotas, and network connectivity.

### Task Routing Is Incorrect

- Review the agent capability definitions.
- Check the semantic analyzer output and routing confidence.
- Verify that the intended agent is registered and available.
- Test with representative tasks for each supported capability.

### Frontend Cannot Reach the Backend

- Confirm that the backend is running on port `8000`.
- Verify the frontend API configuration.
- Check the FastAPI CORS settings.
- Inspect browser developer tools and the backend logs for errors.

### TypeScript Reports Missing Modules

Install the required frontend dependencies from the repository's package configuration and restart the TypeScript server. Avoid modifying shared application code until dependency-related errors have been ruled out.

---

## Future Enhancements

Potential areas for future development include:

- Improved routing accuracy and confidence calibration.
- More specialized agents and model providers.
- Stronger handling of ambiguous and unsupported tasks.
- Richer task execution history and monitoring.
- Improved result formatting and document export.
- Streaming responses for supported workflows.
- Authentication and role-based access control.
- Better observability, error reporting, and automated testing.
- Deployment support and performance optimization.

These are possible extensions rather than claims about currently implemented functionality.

---

## Contributing

Contributions, suggestions, and bug reports are welcome.

To contribute:

1. Fork the repository.
2. Create a branch for your changes.

   ```bash
   git checkout -b feature/your-feature
   ```

3. Implement and test your changes.
4. Commit with a descriptive message.

   ```bash
   git add .
   git commit -m "Add: describe your change"
   ```

5. Push the branch to your fork.

   ```bash
   git push origin feature/your-feature
   ```

6. Open a pull request describing the changes and relevant tests.

Please keep changes modular, avoid committing secrets or local environment files, and update documentation when introducing new functionality.

---

## License

This project is licensed under the **MIT License**.

The MIT License permits use, copying, modification, merging, publishing, distribution, sublicensing, and sale of copies of the software, subject to the license conditions, including preservation of the copyright and permission notice.

The complete license terms are available in the [`LICENSE`](LICENSE) file at the root of this repository.

---

## Acknowledgements

OneAgent is developed as part of an **Open Source Technology (OST) academic project**.

The project builds upon open-source frameworks, libraries, and tools, including Python, FastAPI, Next.js, React, Sentence Transformers, SQLAlchemy, and other dependencies used by the application.

We acknowledge the developers and maintainers of these technologies and the broader open-source community.

---

**OneAgent — One Interface. Intelligent Orchestration. Multiple Capabilities.**
