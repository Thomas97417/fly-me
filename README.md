# my-better-t-app

This project was created with [Better-T-Stack](https://github.com/AmanVarshney01/create-better-t-stack), a modern TypeScript stack that combines React, TanStack Start, Convex, and more.

## Features

- **TypeScript** - For type safety and improved developer experience
- **TanStack Start** - SSR framework with TanStack Router
- **TailwindCSS** - Utility-first CSS for rapid UI development
- **shadcn/ui** - Reusable UI components
- **Convex** - Reactive backend-as-a-service platform
- **Authentication** - Better-Auth
- **Turborepo** - Optimized monorepo build system

## Getting Started

First, install the dependencies:

```bash
bun install
```

## Convex Setup

This project uses Convex as a backend. You'll need to set up Convex before running the app:

```bash
bun run dev:setup
```

Follow the prompts to create a new Convex project and connect it to your application.

Copy environment variables from `packages/backend/.env.local` to `apps/*/.env`.

Then, run the development server:

```bash
bun run dev
```

Open [http://localhost:3001](http://localhost:3001) in your browser to see the web application.
Your app will connect to the Convex cloud backend automatically.

## Project Structure

```
my-better-t-app/
├── apps/
│   ├── web/         # Frontend application (React + TanStack Start)
├── packages/
│   ├── backend/     # Convex backend functions and schema
```

## Available Scripts

- `bun run dev`: Start all applications in development mode
- `bun run build`: Build all applications
- `bun run dev:web`: Start only the web application
- `bun run dev:setup`: Setup and configure your Convex project
- `bun run check-types`: Check TypeScript types across all apps

## Environment Variables

Create the following env files before running the app:

### `packages/backend/.env.local`

```env
CONVEX_DEPLOYMENT=dev:<your-deployment-name>
BETTER_AUTH_SECRET=<your-secret>
BETTER_AUTH_URL=http://localhost:3001
RESEND_API_KEY=<your-resend-api-key>
```

### `apps/web/.env`

```env
CONVEX_DEPLOYMENT=dev:<your-deployment-name>
CONVEX_URL=https://<your-deployment-name>.convex.cloud
VITE_CONVEX_URL=https://<your-deployment-name>.convex.cloud
VITE_CONVEX_SITE_URL=https://<your-deployment-name>.convex.site
BETTER_AUTH_SECRET=<your-secret>
BETTER_AUTH_URL=http://localhost:3001
RESEND_API_KEY=<your-resend-api-key>
EMAIL_FROM=<your-email> (onboarding@resend.dev)
```

> Run `bun run dev:setup` first to get your Convex deployment name, then copy the values from `packages/backend/.env.local` to `apps/web/.env`.
