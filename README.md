# Personal Finance Tracker

A production-quality single-user personal finance tracking web application built with Next.js App Router, TypeScript, Tailwind CSS, shadcn/ui, and Prisma with MongoDB.

## Tech Stack

- **Framework**: Next.js (App Router)
- **Language**: TypeScript (Strict Mode)
- **UI & Styling**: Tailwind CSS, shadcn/ui, Lucide React icons
- **Database & ORM**: MongoDB, Prisma ORM
- **Authentication**: HTTP-only session cookies with bcrypt hashing
- **Validation**: Zod
- **Visualization**: Recharts

## Project Architecture & Directory Structure

```text
src/
├── app/
│   ├── (auth)/          # Authentication pages (login, session handling)
│   ├── (dashboard)/     # Dashboard and protected routes
│   ├── layout.tsx       # Root application layout
│   ├── page.tsx         # Landing / entry page
│   └── globals.css      # Design tokens and global CSS
├── components/
│   ├── ui/              # Primitive reusable UI elements (shadcn/ui)
│   ├── layout/          # Page layouts, navbar, sidebar, header
│   ├── dashboard/       # Dashboard overview widgets and charts
│   ├── transactions/    # Transaction tables, forms, filters
│   ├── budgets/         # Budgeting components and progress indicators
│   ├── categories/      # Category management components
│   └── recurring/       # Recurring expense management components
├── actions/             # Server Actions for data mutations
├── lib/
│   ├── auth/            # Auth helpers, session encryption, cookies
│   ├── db/              # Prisma client initialization & DB access
│   ├── finance/         # Financial calculations and domain logic
│   ├── validations/     # Zod validation schemas
│   └── utils/           # Utility functions (cn, formatters)
├── types/               # TypeScript type definitions and interfaces
└── constants/           # App-wide constants and default configs

prisma/
└── schema.prisma        # Prisma MongoDB schema definition
```

## Getting Started

1. Install dependencies:
   ```bash
   npm install
   ```

2. Copy `.env.example` to `.env` and fill in your configuration:
   ```bash
   cp .env.example .env
   ```

3. Generate Prisma client:
   ```bash
   npx prisma generate
   ```

4. Run development server:
   ```bash
   npm run dev
   ```

5. Run type checking and linting:
   ```bash
   npm run type-check
   npm run lint
   ```
