# DataPilot AI - Xamine

> An AI-assisted data quality and dataset analysis platform that helps users upload datasets, inspect data quality, and understand analysis results through a web dashboard.

DataPilot AI is built as a full-stack application with a React frontend, a FastAPI backend, and Supabase for authentication and (where configured) persistent data storage.

## Contents

- [Features](#features)
- [Architecture](#architecture)
- [Technology stack](#technology-stack)
- [Prerequisites](#prerequisites)
- [Project structure](#project-structure)
- [1. Clone the repository](#1-clone-the-repository)
- [2. Configure Supabase](#2-configure-supabase)
- [3. Set up the backend](#3-set-up-the-backend)
- [4. Set up the frontend](#4-set-up-the-frontend)
- [5. Run the complete application](#5-run-the-complete-application)
- [Environment variables](#environment-variables)
- [Testing and build checks](#testing-and-build-checks)
- [Common problems](#common-problems)
- [Security notes](#security-notes)
- [Deployment overview](#deployment-overview)
- [Team Git workflow](#team-git-workflow)

## Features

The application is intended to provide the following user journey, depending on the features enabled in the current branch:

1. Sign in or authenticate through Supabase.
2. Upload a supported dataset to the FastAPI service.
3. Analyse dataset structure and data quality.
4. Review summary metrics and analysis results in the React dashboard.
5. View results for the selected dataset and use the available dashboard navigation.

Supported file types, maximum upload size, available metrics, and AI-provider requirements depend on the backend implementation. Check the API validation and UI before promising support for a specific format.

## Architecture

```text
Browser
  |
  v
React + Vite frontend
  |-- Supabase client: authentication/session
  |
  | HTTP API requests (VITE_API_URL)
  v
FastAPI backend
  |-- Upload and dataset analysis
  |-- Validation and error responses
  |
  v
Supabase services (if configured by the backend)
  |-- PostgreSQL database / persisted records
  |-- Authentication
```

**Important:** Supabase authentication in the frontend does not automatically mean every backend endpoint is protected. Confirm that the backend validates the user's access token before treating an endpoint as private. Similarly, persistence depends on the backend actually writing records to Supabase.

## Technology stack

- **Frontend:** React, Vite, JavaScript, React Router
- **Backend:** Python, FastAPI
- **Authentication / database:** Supabase
- **API communication:** HTTP/JSON and file uploads
- **Version control:** Git and GitHub

The exact dependency versions are defined by the repository's `package.json`, lockfile, and Python dependency file. Use those files as the source of truth.

## Prerequisites

Install these tools before starting:

- **Git:** https://git-scm.com/downloads
- **Node.js LTS (includes npm):** https://nodejs.org/en/download
- **Python:** use a stable version supported by every package pinned in `requirements.txt`. Python 3.12 or 3.13 is a sensible starting point only if the project's dependencies support it.
- **VS Code** (recommended): https://code.visualstudio.com/
- **Supabase project:** https://supabase.com/

After installing Node.js, close and reopen PowerShell or VS Code. Verify the tools:

```powershell
node --version
npm --version
git --version
python --version
```

If `python` does not point to the intended version on Windows, try:

```powershell
py --list
py -3.13 --version
```

Replace `3.13` with the installed version supported by your dependencies.

## Project structure

The exact folder names can vary by branch. A typical layout is:

```text
DataPilot-AI/
├── frontend/                 # React + Vite application
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   └── lib/
│   │       └── supabase.js   # Supabase client (name may vary)
│   ├── package.json
│   ├── package-lock.json
│   └── .env.example
├── backend/                  # FastAPI application
│   ├── main.py
│   ├── requirements.txt
│   └── .env.example
├── .gitignore
└── README.md
```

Your repository may instead place `main.py`, `requirements.txt`, or the frontend directly at the repository root. **Do not move files to match this example.** First inspect the actual repository:

```powershell
Get-Location
Get-ChildItem -Force
Get-ChildItem -Recurse -Filter package.json
Get-ChildItem -Recurse -Filter requirements.txt
Get-ChildItem -Recurse -Filter main.py
```

The commands below assume `frontend/` and `backend/` folders. If your files are in different locations, run the same commands from the folder containing the relevant file.

## 1. Clone the repository

If this machine does not have the repository yet, copy the repository URL from GitHub and run:

```powershell
git clone https://github.com/Scubek06/TRI26136-Quadruples
cd https://github.com/Scubek06/TRI26136-Quadruples
```

If the repository is already on this machine, open its existing folder instead. To update it safely:

```powershell
git status
git pull --ff-only
```

If `git status` shows uncommitted work, review and commit or back it up before pulling. Do not delete local changes just to resolve a Git error.

## 2. Configure Supabase

1. Create or open your Supabase project: https://supabase.com/dashboard
2. In the project's API settings, locate the **Project URL** and the **publishable/anon key**.
3. Put the values in the frontend environment file described below.
4. Put any backend-only credentials in the backend environment file, if the backend actually needs them.
5. Review the project's SQL/schema setup and apply the migrations or SQL scripts included in the repository, if any.

Never put a Supabase **service-role/secret key** in a frontend variable such as `VITE_*`. Vite exposes `VITE_*` values to browser code.

If the repository does not include a schema or migration file, inspect the backend's Supabase queries and the dashboard tables before creating tables. Do not guess table names or columns.

## 3. Set up the backend

Open PowerShell at the repository root, then change to the directory containing `main.py` and `requirements.txt`. For the example structure:

```powershell
cd TRI26136-Backend
```

### Create and activate a virtual environment

On Windows PowerShell:

```powershell
py -3.13 -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
```

Use a Python version supported by your pinned dependencies. If `py -3.13` is not installed, check `py --list` and select an installed compatible version.

If PowerShell blocks activation, you can either allow scripts for the current terminal:

```powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
.\.venv\Scripts\Activate.ps1
```

Or skip activation and invoke the virtual environment's Python directly:

```powershell
.\.venv\Scripts\python.exe -m pip install --upgrade pip
```

### Install Python dependencies

If the repository has `requirements.txt`:

```powershell
python -m pip install -r requirements.txt
```

If the dependency file is in a different directory, run the command from that directory or provide its relative path. Do not install packages one by one unless troubleshooting a specific dependency.

### Configure backend environment variables

Create a `.env` file beside the backend entry point if the application loads environment variables from that location. Start from `.env.example` if one exists:

```powershell
Copy-Item .env.example .env
```

Edit `.env` and fill in the variables required by the code. Variable names differ by implementation; inspect `main.py`, configuration files, and `os.getenv(...)` calls. A generic example (remove variables your code does not use) is:

```dotenv
# Example only — use the exact names referenced by your backend code.
SUPABASE_URL=https://YOUR_PROJECT.supabase.co
SUPABASE_KEY=YOUR_SERVER_SIDE_KEY_IF_REQUIRED
# AI_PROVIDER_API_KEY=YOUR_KEY_IF_REQUIRED
```

Do not commit `.env`. Do not use a service-role key unless the backend genuinely requires privileged server-side access; if used, keep it server-side and apply strict authorization checks.

### Start FastAPI

If your application entry point is `main.py` and it defines `app = FastAPI()`, run:

```powershell
python -m uvicorn main:app --reload --host 127.0.0.1 --port 8000
```

If `main.py` is inside a Python package or uses another application object, adjust the import path accordingly. Keep this terminal running.

Open the interactive API documentation at:

- http://127.0.0.1:8000/docs
- http://127.0.0.1:8000/openapi.json

If the project defines a health endpoint, test that endpoint too. Do not assume `/health` exists unless it appears in the API routes.

## 4. Set up the frontend

Open a **second** PowerShell terminal at the repository root and enter the directory containing `package.json`:

```powershell
cd TRI26136-frontend
```

Install dependencies from the lockfile:

```powershell
npm ci
```

If there is no `package-lock.json`, use:

```powershell
npm install
```

### Configure frontend environment variables

Create the frontend `.env` file. If `.env.example` exists:

```powershell
Copy-Item .env.example .env
```

Set the API base URL to the locally running FastAPI server. A common configuration is:

```dotenv
VITE_API_URL=http://127.0.0.1:8000
VITE_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
VITE_SUPABASE_ANON_KEY=YOUR_PUBLISHABLE_OR_ANON_KEY
```

These names must match the frontend source code. If the project uses a different name for its Supabase key, use the exact name referenced in `src/lib/supabase.js` or the equivalent file. Do not add secrets to `VITE_*` variables.

Restart Vite after changing `.env`; environment variables are read when the development server starts.

### Start Vite

```powershell
npm run dev
```

Vite prints a local URL, commonly http://localhost:5173. Open the URL shown in your terminal.

## 5. Run the complete application

Keep two terminals open:

| Terminal | Directory | Command | Purpose |
|---|---|---|---|
| 1 | Backend folder | `python -m uvicorn main:app --reload --host 127.0.0.1 --port 8000` | API and analysis |
| 2 | Frontend folder | `npm run dev` | React web app |

Then verify the user journey:

1. Open the frontend URL printed by Vite.
2. Sign in if authentication is enabled.
3. Upload a small test dataset supported by the application.
4. Run the analysis.
5. Confirm that the dashboard displays results without a console or API error.
6. Refresh or revisit the dataset to check persistence, if persistence is implemented.
7. Test an invalid file and an unauthenticated session to confirm errors are handled safely.

A successful frontend page load alone does not prove the backend, authentication, or persistence is working.

## Environment variables

Use the names found in your code. The following table documents common names used by this type of setup; it is not a claim that every variable is required by every branch.

| Variable | Location | Purpose |
|---|---|---|
| `VITE_API_URL` | Frontend `.env` | Base URL for FastAPI requests |
| `VITE_SUPABASE_URL` | Frontend `.env` | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Frontend `.env` | Browser-safe Supabase publishable/anon key |
| `SUPABASE_URL` | Backend `.env`, if used | Supabase project URL |
| `SUPABASE_KEY` | Backend `.env`, if used | Server-side key expected by the backend |
| AI provider key | Backend `.env`, if used | Credentials for an enabled AI integration |

### Environment file rules

- Keep real credentials in local `.env` files or your hosting provider's secret manager.
- Commit `.env.example` with placeholder values, not real secrets.
- Ensure `.env`, `.venv/`, `node_modules/`, build outputs, and Python cache files are ignored by Git.
- After adding or changing an environment variable, restart the relevant server.
- Never paste production secrets into issues, screenshots, public repositories, or chat messages.

## Testing and build checks

### Frontend

From the frontend directory:

```powershell
npm run
npm run build
```

`npm run` lists the scripts configured in `package.json`. Run linting or tests only if corresponding scripts exist, for example:

```powershell
npm run lint
npm test
```

If a script is not defined, npm will report a missing script; inspect `package.json` rather than assuming it exists.

### Backend

From the backend directory with its virtual environment activated:

```powershell
python -m compileall .
python -m uvicorn main:app --reload --host 127.0.0.1 --port 8000
```

Run the project's test suite if one exists, for example:

```powershell
python -m pytest
```

A passing compile check does not replace API and end-to-end tests. Test uploads, validation failures, missing environment variables, authentication, and persistence.

## Common problems

### `node` or `npm` is not recognized

1. Install Node.js LTS from https://nodejs.org/en/download.
2. Ensure the installer adds Node.js to PATH.
3. Close and reopen the terminal or VS Code.
4. Run `node --version` and `npm --version` again.

### Python version or package installation errors

- Use a stable Python version supported by the exact versions pinned in `requirements.txt`.
- Check installed versions with `py --list`.
- Recreate the virtual environment with the compatible interpreter if it was created with an incompatible version.
- Read the first package build error carefully; do not randomly upgrade pinned packages.

To recreate a local virtual environment, first make sure no important files are stored inside `.venv`:

```powershell
deactivate
Remove-Item -Recurse -Force .venv
py -3.13 -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
python -m pip install -r requirements.txt
```

Change `3.13` to your selected compatible version. The deletion command removes only the `.venv` directory in the current folder, so verify your location before running it.

### `ModuleNotFoundError` or `uvicorn` not found

Make sure the backend virtual environment is active and install dependencies using that environment's Python:

```powershell
python -m pip install -r requirements.txt
python -m uvicorn main:app --reload --host 127.0.0.1 --port 8000
```

### Frontend cannot reach the backend

- Confirm FastAPI is running on port `8000`.
- Confirm `VITE_API_URL` matches the backend URL exactly.
- Restart Vite after editing `.env`.
- Check browser DevTools → Network and Console for the failing request.
- Confirm FastAPI's CORS configuration allows the local frontend origin, such as `http://localhost:5173`. Configure explicit allowed origins; do not disable security broadly in production.

### Supabase sign-in or database errors

- Verify the project URL and browser-safe key.
- Confirm the required Supabase tables, policies, and migrations exist.
- Check the browser Network tab and backend logs.
- If Row Level Security is enabled, ensure policies permit only the intended users to access their records.
- Do not solve permission errors by exposing a service-role key to the frontend or disabling Row Level Security without a deliberate security review.

### Port already in use

Choose another available port, then update the matching frontend environment variable or configuration. For example, FastAPI can run on port `8001`:

```powershell
python -m uvicorn main:app --reload --host 127.0.0.1 --port 8001
```

Then set `VITE_API_URL=http://127.0.0.1:8001` and restart Vite.

### Git says there are local changes

Check before switching branches or pulling:

```powershell
git status
git diff
```

Commit your work or back it up before integrating remote changes. Avoid `git reset --hard` and forced pushes unless you fully understand their effect and have team approval.

## Security notes

- Validate file type, file size, and file contents on the backend.
- Treat uploaded datasets as untrusted input.
- Avoid logging secrets or entire datasets that may contain personal or sensitive information.
- Validate authentication tokens on protected backend routes; frontend-only route guards are not API security.
- Use Supabase Row Level Security and least-privilege access policies.
- Keep privileged service-role keys and AI provider keys server-side only.
- Configure production CORS to allow only the deployed frontend origin(s).
- Use HTTPS for public deployments.
- Add rate limits and upload/resource limits before exposing upload endpoints publicly.

## Deployment overview

A common deployment arrangement is:

- **Frontend:** Vercel or another static frontend host
- **Backend:** a Python-compatible application host(Render)
- **Database and authentication:** Supabase

Configure production environment variables in each host's dashboard; local `.env` files are not automatically uploaded. Set the frontend's `VITE_API_URL` to the public HTTPS API URL, configure backend CORS for the deployed frontend domain, and verify Supabase authentication redirects and access policies.

Before calling the app deployed, verify the public frontend, API documentation or health route, sign-in, upload/analysis, error handling, and persistence using production URLs. Do not commit secrets to make deployment work.

## Team Git workflow

Start by checking the current branch and working tree:

```powershell
git status
git branch --show-current
git pull --ff-only
```

After making and testing changes:

```powershell
git add .
git commit -m "Describe the change"
git push
```

Before committing, review `git status` and ensure `.env`, service-role keys, API tokens, `.venv/`, and `node_modules/` are not staged.

### Set up the repository on another machine

```powershell
git clone <YOUR_GITHUB_REPOSITORY_URL>
cd <YOUR_REPOSITORY_FOLDER>
```

Install the prerequisites, configure local `.env` files, then follow the backend and frontend setup sections above. Git does not transfer ignored environment files or virtual environments; each developer must create their own local configuration.

## Demo checklist

- [ ] Frontend starts successfully.
- [ ] Backend starts successfully and API docs load.
- [ ] Supabase authentication works, if enabled.
- [ ] A valid dataset uploads and analysis completes.
- [ ] Results display correctly on the dashboard.
- [ ] Invalid input produces a useful error rather than crashing the app.
- [ ] Protected endpoints reject unauthenticated requests, where applicable.
- [ ] Results persist after refresh if persistence is a supported feature.
- [ ] Production build succeeds.
- [ ] Production frontend and API URLs have been tested.

---

## Maintainers

**Project:** DataPilot AI - Xamine
**Repository:** Add your GitHub repository URL here.  
**Team:** Add your team or organization details here.

For accurate setup instructions, keep this README aligned with the current `package.json`, Python dependency file, backend configuration, Supabase schema/migrations, and deployment settings.
