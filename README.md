# E-Learning Platform

A full-stack e-learning platform for programming courses, built for a three-role workflow:

- Students can discover courses, enroll, learn through lessons, and track progress.
- Instructors can create and manage course content, lessons, and learner interactions.
- Admins can review content, manage users, and operate the platform.

This repository contains both the frontend and backend applications used to run the platform.

## Highlights

- Role-based access control for `STUDENT`, `INSTRUCTOR`, and `ADMIN`
- Course lifecycle management from draft to review and publication
- Lesson-based learning flow with progress tracking
- Instructor dashboards for course, student, and reporting workflows
- Admin moderation and operational management tools
- Modern frontend and backend stack with clear separation of concerns

## Tech Stack

### Frontend

- React 18
- Vite
- TypeScript
- Tailwind CSS
- Redux Toolkit
- React Router

### Backend

- NestJS
- TypeScript
- TypeORM
- MySQL / TiDB
- JWT-based authentication

## Repository Structure

```text
.
|- frontend/   React + Vite client application
|- backend/    NestJS API server
|- docs/       Project docs, requirements, and architecture notes

```

## Core Roles

### Student

- Browse and search courses
- Enroll in paid courses
- Watch lessons and follow learning progress
- Join course discussions and Q&A

### Instructor

- Create and edit courses
- Manage lessons and curriculum
- Review learner activity
- View instructor-side reports and dashboards

### Admin

- Moderate and publish course content
- Manage users and permissions
- Review platform-level reporting data

## Getting Started

### Prerequisites

- Node.js 18+
- npm
- MySQL or TiDB

### 1. Clone the repository

```bash
git clone https://github.com/valnoccc/TTTN_E-Learning-Platform.git
cd TTTN_E-Learning-Platform
```

### 2. Install dependencies

Install frontend dependencies:

```bash
cd frontend
npm install
```

Install backend dependencies:

```bash
cd ../backend
npm install
```

### 3. Configure environment variables

Create the environment files required by the frontend and backend before running locally.

At minimum, you should prepare:

- backend database connection settings
- backend JWT or auth-related secrets
- frontend API base URL
- any cloud storage or media settings if your local flow depends on them

Because this repository does not currently ship a complete public `.env.example`, review the backend and frontend config usage before first run.

### 4. Run the applications

Start the backend:

```bash
cd backend
npm run start:dev
```

Start the frontend in a second terminal:

```bash
cd frontend
npm run dev
```

Typical local URLs:

- Frontend: `http://localhost:5173`
- Backend: `http://localhost:3000`

## Available Scripts

### Frontend

```bash
cd frontend
npm run dev
npm run build
npm run lint
npm run preview
```

### Backend

```bash
cd backend
npm run start:dev
npm run build
npm run lint
npm run test
npm run test:e2e
```

## Development Notes

- The frontend and backend are versioned in the same repository.
- The project uses a role-based route structure for different actor experiences.
- The backend is organized by NestJS modules such as `auth`, `users`, `courses`, `lessons`, and `enrollments`.
- Most project-specific documentation lives in the `docs/` directory.

## Documentation

Useful project documents:

- [Project Overview](./docs/project-overview.md)
- [Requirements](./docs/requirements.md)
- [Architecture](./docs/architecture.md)
- [AI Agent Workflow](./docs/ai-agent-workflow.md)
- [Frontend State Management](./docs/frontend-state-management.md)
- [API Contract](./docs/api-contract.md)

## Contributing

Contributions are welcome. If you want to contribute:

1. Fork the repository.
2. Create a feature branch.
3. Make focused changes with clear commit messages.
4. Run relevant checks before opening a pull request.
5. Open a pull request describing the problem, solution, and validation steps.

For larger changes, it helps to open an issue or discussion first so scope and direction are aligned early.

## Roadmap Ideas

- Improve public setup documentation with a complete `.env.example`
- Expand automated testing coverage
- Improve deployment guidance for frontend and backend
- Continue refining student, instructor, and admin user flows

## License

This repository is currently marked as `UNLICENSED` in the backend package metadata.

If the project is intended to be published as a true open-source repository, add a top-level `LICENSE` file and update this section accordingly.
