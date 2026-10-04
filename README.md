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

## Database Architecture (Prisma + MongoDB)

The database models are designed to be dynamic and scalar-independent:

- **User**: Single user authentication entity (`id`, `email`, `passwordHash`).
- **Category**: Dynamic income/expense categories linked to user (`userId`, `name`, `type`, `active`). Adding a category requires zero UI code changes.
- **Transaction**: Immutable ledger entries (`userId`, `date`, `type`, `categoryId`, `amount`, `notes`).
- **Budget**: Category-level monthly budgets (`userId`, `categoryId`, `month`, `amount`). Enforces unique `(userId, categoryId, month)`.
- **RecurringTransaction**: Templates for periodic expenses/income (`frequency`, `startDate`, `endDate`, `active`, `recurrenceConfig`).

Centralized database access modules reside in `src/lib/db/`:
- `categories.ts`
- `transactions.ts`
- `budgets.ts`
- `recurring.ts`
- `user.ts`

## Database Setup & Seeding

1. **Environment Variables**:
   Copy `.env.example` to `.env` and set your MongoDB connection string:
   ```bash
   cp .env.example .env
   ```

2. **Generate Prisma Client**:
   ```bash
   npx prisma generate
   ```

3. **Seed Database**:
   Seed initial single user and default income/expense categories (Salary, Freelance, Groceries, Rent, Utilities, etc.):
   ```bash
   npx prisma db seed
   ```

   *Note: Custom initial user credentials can be set via `INITIAL_USER_EMAIL` and `INITIAL_USER_PASSWORD` in `.env` before running seed.*

## Running Development Server

```bash
npm run dev # or pnpm dev
```

Run type checking and linting:
```bash
npm run type-check
npm run lint
```
