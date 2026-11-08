# GYMWEAR Backend

Modular monolith API: Node.js + Express 5 + TypeScript, Prisma 7 (PostgreSQL/Neon), Cloudinary.

This package lives in `backend/`; the React app lives in `frontend/`.

## Setup

```sh
cd backend
npm install
cp .env.example .env   # fill in Neon and Cloudinary credentials
npm run db:generate
npm run dev
```

## Scripts

```sh
npm run dev          # start with tsx watch
npm run build        # compile to dist/
npm start            # run the compiled build
npm run db:generate  # generate Prisma Client
npm run db:migrate   # create/apply migrations
npm run db:studio    # open Prisma Studio
```

## Structure

```
backend/
  prisma/
    schema.prisma
  prisma.config.ts
  src/
    config/       # environment and Cloudinary configuration
    database/     # Prisma client (Neon pooled connection)
    errors/       # AppError
    middleware/   # error handler, 404 handler
    modules/      # one folder per domain module
      <module>/
        <module>.routes.ts
        <module>.controller.ts
        <module>.service.ts
        <module>.validation.ts
        <module>.types.ts
    utils/        # shared utilities
    app.ts        # Express app and route registration
    server.ts     # HTTP server entry point
```

## Environment

- `DATABASE_URL` — Neon pooled connection, used by the app at runtime.
- `DIRECT_URL` — Neon direct connection, used by the Prisma CLI for migrations.
- `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`.

Only `GET /health` exists so far. Module routers, controllers, services, validations and types are empty placeholders.
