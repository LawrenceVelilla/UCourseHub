# UCourseHub

A web application for searching University of Alberta courses with integrated professor ratings from RateMyProfessor and Reddit discussions for added context.

## Features

- Course search with detailed information
- Professor ratings from RateMyProfessor
- Reddit discussions for courses
- Course prerequisites, corequisites, and dependents

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
OPENAI_API_KEY=your_key
FRONTEND_URL1=http://localhost:5173
FRONTEND_URL2=your_deployed_frontend_url
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

## API Routes

### Public Routes

#### Course Data (Fetching logic)
- `GET /api/course?courseCode=<courseCode>` - Get course details
- `GET /api/dependents?courseCode=<courseCode>` - Get course dependents
- `GET /api/?department=<department>` - Get department professors
- `GET /api/professors?courseId=<courseId>` - Get professors for a course
- `GET /api/reddit/discussions?courseId=<courseId>` - Get Reddit discussions for a course

### Admin Routes

#### RateMyProfessor (To be moved to a different folder when I start working on the recommendation systme since this is mostly offline and doesnt need to be handled by the backend server)
- `GET /api/admin/rmp/` - Health check
- `POST /api/admin/rmp/` - Fetch professors from RateMyProfessor

#### Scrapers (To be moved to a different folder when I start working on the recommendation systme since this is mostly offline and doesnt need to be handled by the backend server)
- `GET /api/admin/scraper/prof-scraper?department=<department>` - Scrape professors from the Professor catalogue
- `GET /api/admin/scraper/course-scraper?department=<department>&from=<from>&to=<to>` - Scrape courses
- `GET /api/admin/scraper/reddit-scraper?courseCode=<courseCode>&limit=<limit>` - Scrape Reddit posts
- `POST /api/admin/scraper/professor-sync?department=<department>` - Sync professors to courses (Use this when you already have the Professor Data and just want to sync it to the courses)
- `POST /api/admin/scraper/professor-full-sync?department=<department>&schoolId=<schoolId>&rmpDepartmentId=<rmpDepartmentId>` - Full professor sync (Full cycle -> Scrape&Sync)
- `POST /api/admin/scraper/reddit/department?department=<department>` - Scrape Reddit for department
- `POST /api/admin/scraper/reddit/course?courseCode=<courseCode>&maxPages=<maxPages>` - Scrape Reddit for specific course
- `POST /api/admin/scraper/reddit/courses/title-search` - Scrape Reddit for multiple courses (body: courseCodes array)

## Future plans

- Add suggestions/recommendations for courses based on the course searched
    - Say we are searching CMPUT 291, we could add a section that says "If you found this course hard, you might also find these courses hard: ... "
    - Make sure to keep context (e.g. both CMPUT 291 and NURS 223 are hard, but wont recommend each other since they are in different departments and they are not prereqs/coreqs of each other)
- Although we have the caching provided by TanstackQuery, we should add a Redis cache to the backend to reduce database load and improve concurrent user support.



### If you have any cool ideas you think would be cool to add, feel free to make a pull request or let me know and lets collaborate!