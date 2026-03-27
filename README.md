# UCourseHub

A web application for searching University of Alberta courses with integrated professor ratings from RateMyProfessor and Reddit discussions for added context.

## Features

- Course search with autocomplete
- Professor ratings from RateMyProfessor
- Reddit discussions for courses
- Course prerequisites, corequisites, and dependents
- Degree planner with drag-and-drop
- GPA calculator
- Google OAuth authentication

## Architecture

```
frontend/          → React SPA on Cloudflare Pages
backend/           → Express API on Render
data/              → Offline scrapers & CLI tool
```

The frontend and API are separate deployments. Cloudflare proxies `/api/*` requests to the backend via a Pages Function.

## Installation

```bash
git clone https://github.com/LawrenceVelilla/UCourseHub.git
```

### Backend

```bash
cd backend
npm install
```

### Frontend

```bash
cd frontend
npm install
```

### Data Pipeline (CLI)

```bash
cd data
npm install
```

## Setup

1. Copy the example environment file:
```bash
cp backend/.env.example backend/.env
```

2. Configure the following environment variables in `backend/.env`:
```
PORT=3000
NODE_ENV=development
DATABASE_URL=postgresql://user:password@host/database
FRONTEND_URL1=http://localhost:5173
FRONTEND_URL2=your_deployed_frontend_url
```

3. For the data pipeline, configure `data/.env`:
```
DATABASE_URL=postgresql://user:password@host/database
OPENAI_API_KEY=your_key
REDDIT_CLIENT_ID=your_reddit_client_id
REDDIT_CLIENT_SECRET=your_reddit_client_secret
```

## Running the Application

### Backend
```bash
cd backend
npm run dev
```

### Frontend
```bash
cd frontend
npm run dev
```

The backend server runs on port 3000 and the frontend on port 5173.

### Data Pipeline
```bash
cd data
node cli/index.js
```

Interactive CLI with options to scrape courses, professors, and Reddit discussions.

## API Routes

All API routes are versioned under `/api/v1`.

### Courses

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/courses` | List all courses (code + title) |
| GET | `/api/v1/courses/:courseCode` | Get course details |
| GET | `/api/v1/courses/:courseCode/dependents` | Get courses that require this course |
| GET | `/api/v1/courses/:id/professors` | Get professors for a course |
| GET | `/api/v1/courses/:id/discussions` | Get Reddit discussions for a course |

### Plans (authenticated)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/plans` | List user's plans |
| GET | `/api/v1/plans/:id` | Get plan details |
| POST | `/api/v1/plans` | Create a plan |
| PUT | `/api/v1/plans/:id` | Update a plan |
| DELETE | `/api/v1/plans/:id` | Delete a plan |

### User Courses (authenticated)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/user/courses` | List user's completed courses |
| POST | `/api/v1/user/courses` | Add a completed course |
| DELETE | `/api/v1/user/courses/:courseCode` | Remove a completed course |

### Auth

Authentication is handled by [Better Auth](https://www.better-auth.com/) at `/api/auth/*`.

## Data Pipeline

Scraping and data processing is handled offline via an interactive CLI tool (`data/cli/index.js`), not through the API. The pipeline collects data from three sources:

- **UAlberta Course Catalogue** — Cheerio-based scraper with GPT-4o-mini for prerequisite parsing
- **Rate My Professors** — Reverse-engineered GraphQL API
- **Reddit r/uAlberta** — OAuth2 API with rate limiting and exponential backoff

## Tech Stack

- **Frontend**: React, TypeScript, TanStack Query, Tailwind CSS, Cloudflare Pages
- **Backend**: Express, TypeScript, Drizzle ORM, PostgreSQL, Helmet, Render
- **Data**: Cheerio, Selenium, OpenAI, Zod
- **Auth**: Better Auth with Google OAuth

## Contributing

If you have any cool ideas you think would be cool to add, feel free to make a pull request or let me know and lets collaborate!
