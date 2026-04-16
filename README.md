# Trellis

A Trello-inspired Kanban project management tool built for the SDE Intern Fullstack assignment.

## Tech Stack

- Frontend: React 18 + Vite + TypeScript
- Backend: Node.js + Express + TypeScript
- Database: PostgreSQL + Prisma ORM
- Drag and drop: `@hello-pangea/dnd`
- Local database runtime: Docker Compose

## Features

- Create and switch between multiple boards
- Create, rename, delete, and reorder lists
- Create, edit, archive, delete, and reorder cards
- Drag cards within a list and across lists
- Card detail modal with:
  - title
  - description
  - labels
  - due date
  - member assignment
  - checklists with items
  - basic activity log
- Search cards by title
- Filter by labels, members, and due date state
- Seeded sample data for boards, members, lists, cards, labels, and checklists
- Responsive layout for desktop, tablet, and mobile

## Project Structure

```text
.
├── client/            # React frontend
├── server/            # Express API + Prisma schema/seed
├── docker-compose.yml # PostgreSQL service
└── package.json       # Workspace scripts
```

## Data Model

The schema is designed around ordered Kanban data and normalized many-to-many relations:

- `Board`
- `BoardList`
- `Card`
- `User`
- `BoardMember`
- `Label`
- `CardLabel`
- `CardMember`
- `Checklist`
- `ChecklistItem`
- `Activity`

Key design choices:

- `position` columns are stored on lists, cards, checklists, and checklist items to support stable ordering.
- Labels and members are normalized through join tables so a card can have many labels and assignees.
- Checklists and checklist items are split into separate tables for clean extensibility.
- Cards support soft removal through `isArchived`.

## Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Start PostgreSQL

```bash
npm run db:start
```

The helper script will use `docker compose`, `docker-compose`, or a direct `docker run` fallback depending on what is installed locally.

### 3. Prepare the database

```bash
npm run db:generate
npm run db:push
npm run db:seed
```

Or use the combined setup script:

```bash
npm run setup
```

### 4. Start the app

```bash
npm run dev
```

Apps run at:

- Frontend: `http://localhost:5173`
- Backend: `http://localhost:4000`

## Environment Variables

`server/.env`

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/trello_clone?schema=public"
PORT=4000
```

## Seed Data

The seed script creates:

- 3 sample members
- 2 sample boards
- multiple lists and cards
- card assignments
- due dates
- labels
- checklists and checklist items
- activity entries

## API Overview

Main endpoints:

- `GET /api/boards`
- `POST /api/boards`
- `GET /api/boards/:boardId`
- `POST /api/lists`
- `PATCH /api/lists/:listId`
- `DELETE /api/lists/:listId`
- `POST /api/lists/reorder`
- `POST /api/cards`
- `PATCH /api/cards/:cardId`
- `DELETE /api/cards/:cardId`
- `POST /api/cards/:cardId/archive`
- `POST /api/cards/reorder`
- `POST /api/cards/:cardId/checklists`
- `PATCH /api/checklists/:checklistId`
- `DELETE /api/checklists/:checklistId`
- `POST /api/checklists/:checklistId/items`
- `PATCH /api/checklist-items/:itemId`
- `DELETE /api/checklist-items/:itemId`

Most mutations return the updated board snapshot so the client can stay in sync with server ordering and relationships.

## Assumptions

- Authentication is intentionally omitted per the assignment.
- A default user context is implied, and seeded sample members are used for assignment.
- Search and filters are handled client-side using the currently loaded board data.
- Drag-and-drop is disabled while filters are active to avoid reordering a partial view of the board.
- File attachments, cover images, comments, and board background editing after creation were not implemented.

## Deployment Notes

- Frontend can be deployed to Vercel or Netlify.
- Backend can be deployed to Render, Railway, or Fly.io.
- PostgreSQL can be hosted on Railway, Neon, Supabase, or Render PostgreSQL.
- Set `VITE_API_URL` in the frontend environment to point to the deployed API URL.
# trelio-rishabh
