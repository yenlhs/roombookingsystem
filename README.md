# Room Booking System

A modern room booking system with mobile and web applications, built as a monorepo.

## Overview

This system enables users to book rooms by hourly slots through a mobile app, while administrators manage rooms, bookings, and users through a web dashboard.

## Tech Stack

- **Monorepo:** Turborepo + pnpm
- **Mobile App:** Expo React Native (TypeScript)
- **Web App:** Next.js 14+ (TypeScript)
- **Backend:** Supabase (PostgreSQL, Auth, Storage)
- **Styling:** Tailwind CSS, NativeWind
- **State Management:** TanStack Query
- **Validation:** Zod

## Project Structure

```
roombookingsystem/
├── apps/
│   ├── mobile/          # Expo React Native app
│   └── web/             # Next.js admin dashboard
├── packages/
│   ├── types/           # Shared TypeScript types
│   ├── utils/           # Shared utility functions
│   ├── validation/      # Zod validation schemas
│   └── supabase/        # Supabase client configuration
├── supabase/            # Supabase migrations and functions
├── package.json         # Root package.json
├── pnpm-workspace.yaml  # pnpm workspace configuration
├── turbo.json           # Turborepo configuration
├── PRD.md              # Product Requirements Document
├── BUILD_PLAN.md       # Detailed build plan
└── PREREQUISITES.md    # Setup prerequisites
```

## Features

### Mobile App (User)
- User registration and authentication
- Browse available rooms
- View room details and operating hours
- Book single or consecutive time slots
- View and manage bookings
- Real-time availability updates

### Web App (Admin)
- Admin dashboard with metrics
- Room management (CRUD operations)
- Configure operating hours and slot durations
- Booking management (view, create, edit, cancel)
- User management
- Analytics and reports

## Prerequisites

- Node.js v18+ (v23.10.0 installed ✅)
- pnpm v8+ (v10.17.1 installed ✅)
- Git (v2.49.0 installed ✅)
- Supabase account
- Expo account
- iOS Simulator or Android Emulator

See [PREREQUISITES.md](PREREQUISITES.md) for detailed setup instructions.

## Getting Started

### 1. Install Dependencies

```bash
pnpm install
```

### 2. Set Up Environment Variables

```bash
# Create .env files for each app
# apps/web/.env.local
# apps/mobile/.env.local
```

### 3. Run Development Servers

```bash
# Run all apps in development mode
pnpm dev

# Or run specific apps
pnpm --filter web dev
pnpm --filter mobile dev
```

## Available Scripts

```bash
pnpm dev          # Run all apps in development mode
pnpm build        # Build all apps for production
pnpm lint         # Lint all packages
pnpm type-check   # Type check all packages
pnpm clean        # Clean all build artifacts
pnpm format       # Format code with Prettier
```

## Development Workflow

See [BUILD_PLAN.md](BUILD_PLAN.md) for the complete development roadmap.

### Current Phase: Phase 1 - Foundation & Infrastructure

**Status:** Task 1.1.1 Complete ✅

**Next Steps:**
- Task 1.1.2: Set Up Shared Packages
- Task 1.1.3: Initialize Next.js Web App
- Task 1.1.4: Initialize Expo Mobile App

## Documentation

- [PRD.md](PRD.md) - Product Requirements Document
- [BUILD_PLAN.md](BUILD_PLAN.md) - Detailed build plan with sequential tasks
- [PREREQUISITES.md](PREREQUISITES.md) - Setup prerequisites and status

## Architecture

### Data Flow

```
Mobile/Web → Supabase Client → PostgreSQL + RLS
                              → Supabase Auth
                              → Supabase Storage
```

### Key Features

- **Row Level Security (RLS):** All database tables protected with RLS policies
- **Real-time Updates:** Live synchronization between mobile and web
- **Type Safety:** End-to-end TypeScript with shared types
- **Monorepo Benefits:** Shared code, consistent tooling, faster builds

## Contributing

This is a private project. See the build plan for development guidelines.

## License

Private - All Rights Reserved

## Contact

Adrian Li-Hung-Shun (yenlhs@gmail.com)

---

**Version:** 1.0.0 (MVP in Development)
**Last Updated:** October 15, 2025
