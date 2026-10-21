# CommitCompass

**CommitCompass** is a full-stack GitHub commit intelligence dashboard
that helps developers explore repository activity, inspect changes, and
better understand commits. It combines GitHub commit data with
AI-assisted explanations and risk analysis in one interface.

-   **Live frontend:** https://commitcompass-frontend.onrender.com
-   **Backend:** https://commitcompass-vci.onrender.com
-   **GitHub repository:**
    https://github.com/ArunKumarJ22/CommitCompass---Version-Control-Intelligence

------------------------------------------------------------------------

## Contents

-   [Problem](#problem)
-   [Solution](#solution)
-   [Features](#features)
-   [What Makes It Different](#what-makes-it-different)
-   [Technology Stack](#technology-stack)
-   [Architecture](#architecture)
-   [How It Works](#how-it-works)
-   [Project Structure](#project-structure)
-   [Run Locally](#run-locally)
-   [Environment Variables](#environment-variables)
-   [API Overview](#api-overview)
-   [Database](#database)
-   [Deployment](#deployment)
-   [Testing](#testing)
-   [Security](#security)
-   [Roadmap](#roadmap)
-   [Contributing](#contributing)

## Problem

Understanding the evolution of a codebase often requires developers to
move between repository pages, commit messages, diffs, and changed-file
lists. A commit message may be brief, a diff may be large, and the
impact or risk of a change may not be immediately obvious. This can make
code exploration and review slower, particularly when first entering an
unfamiliar repository.

## Solution

CommitCompass brings repository history, commit details, changed-file
information, and change statistics into one dashboard. It can store
explored repositories and commit metadata in PostgreSQL. Optional AI
features accept a code diff and return a plain-language explanation or
risk-oriented analysis.

The aim is to help developers move from **"What changed?"** toward
**"What might this change mean?"** more efficiently. AI output supports
engineering review; it does not replace reading code, running tests, or
human judgement.

## Features

### Repository history

-   View previously explored repositories.
-   See repository owner, name, and last-explored time.
-   Persist history in PostgreSQL.

### Commit exploration

-   Retrieve commit information from GitHub.
-   Inspect commit details and changed files.
-   Review statistics such as files changed, lines added, and lines
    removed.
-   Use source links where available to open the corresponding GitHub
    content.

### AI-assisted explanation

-   Submit a code diff to the backend for a plain-language explanation.
-   Use the result as a starting point for understanding a change.

### AI-assisted risk analysis

-   Request a risk-oriented analysis of a diff.
-   Use the output to identify areas that may deserve closer review or
    additional tests.

AI functionality depends on the configured AI provider and credentials.
AI-generated content can be incomplete or inaccurate and should be
validated against the actual code.

## What Makes It Different?

CommitCompass focuses on the commit-understanding workflow rather than
being only a raw list of commits.

  -----------------------------------------------------------------------
  Common workflow                     CommitCompass approach
  ----------------------------------- -----------------------------------
  Read a commit message, then         Show commit information and change
  manually inspect the diff           statistics together

  Switch between repository history   Keep recently explored repositories
  and a separate tracking tool        in persistent history

  Rely only on the author's commit    Use the actual diff as input for
  message                             optional AI explanation

  Review changes without a quick      Offer a separate risk-analysis
  risk-oriented summary               action

  Set up a large platform for a       Use a relatively small React,
  focused task                        Spring Boot, PostgreSQL, and Docker
                                      stack
  -----------------------------------------------------------------------

These are design goals, not a claim that CommitCompass replaces GitHub
or established code-review platforms.

## Technology Stack

### Frontend

-   **React** --- component-based user interface.
-   **TypeScript** --- static typing for frontend code.
-   **Vite** --- development server and production build.
-   **HTML/CSS** --- structure and styling.
-   **Nginx** --- serves the production frontend and proxies API
    requests.

### Backend

-   **Java** --- backend language.
-   **Spring Boot** --- application framework and REST API.
-   **Spring Web** --- HTTP endpoints.
-   **Spring Data JPA and Hibernate** --- persistence and
    object-relational mapping.
-   **Maven** --- dependency management, build, and tests.
-   **GitHub API** --- repository and commit data.
-   **AI provider integration** --- commit explanation and risk analysis
    when configured.

### Database and infrastructure

-   **PostgreSQL** --- repository history and commit metadata.
-   **Neon** --- managed PostgreSQL hosting.
-   **Docker** --- containerization.
-   **Docker Compose** --- local multi-service environment.
-   **Nginx** --- web server and reverse proxy.
-   **Render** --- frontend and backend hosting.
-   **Git/GitHub** --- source control and repository hosting.

## Architecture

``` text
Browser
  |
  v
React + TypeScript frontend (Vite build)
  |
  v
Nginx reverse proxy (/api/*)
  |
  v
Spring Boot REST API
  |             |                |
  v             v                v
GitHub API   AI provider     Spring Data JPA
                                  |
                                  v
                             PostgreSQL
                                (Neon)
```

-   **Frontend:** renders the dashboard, repository history, commit
    details, change statistics, and AI results.
-   **Nginx:** serves static frontend files and forwards `/api/`
    requests to the backend.
-   **Spring Boot:** coordinates GitHub integration, persistence, and AI
    endpoints.
-   **PostgreSQL:** stores repository history and commit metadata.
-   **GitHub API:** provides source-control information.
-   **AI provider:** generates explanations and risk analysis from
    submitted diffs.

## How It Works

1.  The user enters or selects a GitHub repository.
2.  The backend retrieves relevant commit information from GitHub.
3.  Repository history and commit metadata can be stored in PostgreSQL.
4.  The dashboard displays commit details, changed files, and change
    statistics.
5.  Optionally, the frontend sends a diff to an AI endpoint.
6.  The developer reviews the generated explanation or risk analysis and
    verifies important conclusions against the code and tests.

## Project Structure

The main project areas are organized as follows:

``` text
CommitCompass/
├── frontend/
│   ├── src/                  # React + TypeScript application
│   ├── Dockerfile            # Frontend build and Nginx image
│   ├── nginx.conf            # Nginx routing and API proxy
│   ├── package.json          # Scripts and dependencies
│   └── ...
├── backend/
│   ├── src/main/java/
│   │   └── com/commitcompass/backend/
│   │       ├── AiController.java
│   │       ├── GitHubController.java
│   │       ├── RepositoryHistoryController.java
│   │       └── ...
│   ├── src/main/resources/
│   │   └── application.properties
│   ├── Dockerfile
│   └── ...
├── docker-compose.yml
├── .gitignore
└── README.md
```

The exact file list may evolve as the project develops.

## Run Locally

### Prerequisites

-   Git
-   Java JDK compatible with the backend build (the deployed container
    currently uses Java 25)
-   Docker Desktop with Docker Compose
-   Node.js and npm (the frontend Docker build uses Node.js 24)

### 1. Clone the repository

``` bash
git clone https://github.com/ArunKumarJ22/CommitCompass---Version-Control-Intelligence.git
cd CommitCompass---Version-Control-Intelligence
```

If you already have a local checkout, open that project directory
instead.

### 2. Configure environment variables

Create or update the `.env` file expected by `docker-compose.yml`. Keep
secrets out of Git. Use the variable names referenced by your current
Compose and Spring configuration. Common settings include:

``` dotenv
SPRING_DATASOURCE_USERNAME=commitcompass
SPRING_DATASOURCE_PASSWORD=replace_with_local_database_password
GITHUB_TOKEN=replace_with_github_token_if_needed
OPENAI_API_KEY=replace_with_ai_provider_key_if_needed
```

Check `docker-compose.yml` and
`backend/src/main/resources/application.properties` for the exact values
and defaults used by your checkout. Do not commit `.env`.

### 3. Start the services

From the repository root:

``` bash
docker compose up --build -d
```

In the current local setup, the expected addresses are:

-   Frontend: http://localhost:8080
-   Backend: http://localhost:8081
-   PostgreSQL host port: `5433`

Check `docker-compose.yml` if you have changed ports or service names.

### 4. Inspect logs and stop services

``` bash
docker compose ps
docker compose logs -f backend
docker compose logs -f frontend
```

Stop the containers with:

``` bash
docker compose down
```

Avoid `docker compose down -v` unless you intend to remove associated
named volumes and local database data.

### Run the frontend separately (optional)

``` bash
cd frontend
npm ci
npm run dev
```

Vite normally serves the development frontend at http://localhost:5173.
API calls require the backend and an appropriate proxy/CORS
configuration.

### Run backend tests

PowerShell, from `backend/`:

``` powershell
.\mvnw.cmd test
```

macOS/Linux, from `backend/`:

``` bash
./mvnw test
```

## Environment Variables

Configure secrets through local environment files or the hosting
provider's environment settings. Never hard-code credentials.

  -----------------------------------------------------------------------
  Variable                            Purpose
  ----------------------------------- -----------------------------------
  `SPRING_DATASOURCE_URL`             JDBC URL for PostgreSQL

  `SPRING_DATASOURCE_USERNAME`        Database role/user

  `SPRING_DATASOURCE_PASSWORD`        Database password

  `GITHUB_TOKEN`                      Optional GitHub token, depending on
                                      API usage

  `OPENAI_API_KEY`                    Optional key if the AI service uses
                                      OpenAI

  `SERVER_PORT`                       Backend HTTP port; Render is
                                      configured to use port `10000`

  `BACKEND_URL`                       Used only if the active Nginx
                                      configuration uses an
                                      environment-based template
  -----------------------------------------------------------------------

The exact variables consumed depend on the current code and deployment
configuration. Keep `application.properties`, `docker-compose.yml`,
Render settings, and the active Nginx configuration consistent.

## API Overview

The following endpoints are present in the current
implementation/deployment setup. Verify the current controller code for
exact schemas and behavior before integrating another client.

  ------------------------------------------------------------------------------------------------------
  Method                  Endpoint                                               Purpose
  ----------------------- ------------------------------------------------------ -----------------------
  `GET`                   `/api/repositories/history`                            Retrieve repository
                                                                                 exploration history

  `POST`                  `/api/ai/explain`                                      Explain a submitted
                                                                                 code diff

  `POST`                  `/api/ai/risk-analysis`                                Analyze a submitted
                                                                                 code diff for potential
                                                                                 risks

  `GET`                   `/api/github/commits?owner={owner}&repo={repo}`        Retrieve commit
                                                                                 information for a
                                                                                 repository

  `POST`                  `/api/github/commits/sync?owner={owner}&repo={repo}`   Synchronize commit
                                                                                 metadata, if enabled by
                                                                                 the current backend
  ------------------------------------------------------------------------------------------------------

### AI request example

The AI controller accepts a JSON body containing a `diff` field:

``` json
{
  "diff": "diff --git a/example.java b/example.java\n..."
}
```

The explanation endpoint returns an `explanation` field on success. The
risk-analysis endpoint returns an `analysis` field on success. Empty
diffs are rejected.

## Database

The PostgreSQL database includes the following main tables.

### `commits`

Commit metadata includes fields such as:

-   `id`
-   `author_name`
-   `commit_date`
-   `html_url`
-   `message`
-   `repository_name`
-   `repository_owner`
-   `sha`

### `repository_history`

Repository exploration history includes fields such as:

-   `id`
-   `owner`
-   `repo`
-   `last_explored_at`

Spring Data JPA/Hibernate handles persistence. For exact types,
constraints, and indexes, refer to the entity classes and current
schema.

## Deployment

The current deployment uses Render and Neon:

-   **Frontend:** https://commitcompass-frontend.onrender.com
-   **Backend:** https://commitcompass-vci.onrender.com
-   **Database:** Neon-managed PostgreSQL

Deployment outline:

1.  Push source changes to GitHub.
2.  Render builds the backend from `backend/Dockerfile`.
3.  Configure the PostgreSQL JDBC URL, database credentials, server
    port, and any required API keys in Render.
4.  Render builds the frontend from `frontend/Dockerfile`.
5.  Configure the production Nginx proxy to forward `/api/` requests to
    the public backend URL.
6.  Verify the frontend and API using the live URLs.

Useful live checks:

-   Frontend: https://commitcompass-frontend.onrender.com
-   Repository history API:
    https://commitcompass-vci.onrender.com/api/repositories/history

The backend root path `/` may return HTTP 404 if no root route is
defined. Use a real API endpoint to verify the service.

## Testing and Quality Checks

Before pushing changes, run:

``` bash
# Frontend
cd frontend
npm ci
npm run lint
npm run build
```

Then run backend tests from `backend/`:

``` powershell
.\mvnw.cmd test
```

For changes involving GitHub integration, persistence, or AI endpoints,
test the relevant API and inspect browser Network tools and Render logs.

## Security Notes

-   **Keep secrets private.** Do not commit `.env`, database passwords,
    GitHub tokens, or AI keys.
-   **Rotate exposed credentials.** If a secret appears in logs or
    screenshots, replace it and update the deployment environment.
-   **Restrict CORS.** Allow the required frontend origins only; retain
    localhost origins for local development as needed.
-   **Validate AI input.** Diffs may be large or contain untrusted
    content. Consider input size limits and treat source-code comments
    as untrusted data.
-   **Protect public AI endpoints.** Consider authentication, rate
    limiting, and usage quotas before broad public use.
-   **Use controlled database migrations.** Hibernate `ddl-auto=update`
    can be convenient during development, but a migration tool and
    controlled production schema changes are safer as the project
    matures.
-   **Handle GitHub API limits.** Use appropriately scoped tokens when
    required and handle rate-limit responses.
-   **Verify AI output.** Explanations and risk assessments are
    suggestions, not guarantees.

## Roadmap

Potential future improvements:

-   Add automated tests for GitHub integration, database persistence,
    and AI service behavior.
-   Improve error handling for GitHub API failures and rate limits.
-   Add commit search, filters, pagination, and date-based activity
    summaries.
-   Improve links between changed files and GitHub diffs.
-   Return more structured AI explanations with uncertainty indicators.
-   Add configurable risk categories and suggested targeted tests.
-   Introduce database migrations and production observability.
-   Add authentication, rate limiting, and AI usage controls before
    broad public use.
-   Automate build and test checks with CI.

## Contributing

Suggestions and contributions are welcome.

1.  Fork the repository.
2.  Create a focused feature branch.
3.  Make the change and add or update tests where appropriate.
4.  Run frontend lint/build checks and backend tests.
5.  Open a pull request describing the problem and solution.

## Author

**Arun Kumar** --- [GitHub:
@ArunKumarJ22](https://github.com/ArunKumarJ22)

------------------------------------------------------------------------

Built as a practical full-stack project exploring GitHub integration,
Java backend development, React and TypeScript, PostgreSQL persistence,
Docker-based deployment, and AI-assisted developer workflows.
