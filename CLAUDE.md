# Housy - Development Context

> This file provides context for Claude Code when working on this project.

## Project Overview

**Housy** (House + Easy) is a home management application for tracking expenses, chores, and household tasks. It supports both individual users (personal finance tracking) and shared households (roommates, families, couples).

## Tech Stack

| Component | Technology |
|-----------|------------|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS v4 |
| Database | Supabase (PostgreSQL) |
| Auth | Supabase Auth |
| Deployment | Vercel (planned) |
| Automation | n8n Cloud (hidden from users) |

## Project Structure

```
src/
├── app/
│   ├── (auth)/                 # Auth pages (login, register)
│   │   ├── login/page.tsx
│   │   └── register/page.tsx
│   ├── (dashboard)/            # Protected dashboard routes
│   │   ├── dashboard/page.tsx  # Main dashboard
│   │   ├── spese/              # Expenses management
│   │   │   ├── page.tsx        # List expenses
│   │   │   ├── nuova/page.tsx  # New expense form
│   │   │   ├── [id]/page.tsx   # Edit expense
│   │   │   └── categorie/page.tsx # Manage categories
│   │   └── layout.tsx          # Dashboard layout with sidebar
│   ├── onboarding/page.tsx     # Household setup wizard
│   └── actions/                # Server Actions
│       ├── household.ts        # Household CRUD
│       ├── expenses.ts         # Expenses CRUD
│       └── categories.ts       # Categories CRUD
├── components/
│   ├── ui/                     # Shared UI components
│   │   ├── Sidebar.tsx
│   │   └── Header.tsx
│   └── expenses/               # Expense-specific components
│       ├── ExpenseForm.tsx
│       └── ExpenseList.tsx
└── lib/
    └── supabase/               # Supabase configuration
        ├── client.ts           # Browser client
        ├── server.ts           # Server client
        └── middleware.ts       # Auth middleware
```

## Key Patterns

### Server Actions
All database operations use Next.js Server Actions (not API routes):
```typescript
// src/app/actions/expenses.ts
"use server";
export async function createExpense(data: ExpenseInput) { ... }
```

### Supabase RLS
Row Level Security is enabled on all tables. Key functions:
- `get_user_household_ids()` - Returns user's household IDs (SECURITY DEFINER)
- `is_household_admin(hh_id)` - Checks if user is admin (SECURITY DEFINER)
- `create_household_with_admin(name)` - Creates household atomically

### Database Schema
Located in `supabase/schema.sql`. Key tables:
- `users` - User profiles (extends auth.users)
- `households` - Houses/groups
- `household_members` - Membership with roles
- `expenses` - Expense records
- `expense_categories` - Categories per household

### Styling
Using Tailwind CSS v4 with PostCSS:
```javascript
// postcss.config.js
module.exports = {
  plugins: {
    "@tailwindcss/postcss": {},
  },
};
```

Custom colors defined in `globals.css` using `@theme` block.

## Common Commands

```bash
# Development
npm run dev

# Build
npm run build

# Type check
npx tsc --noEmit
```

## Environment Variables

Required in `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

## Current State

### Completed
- Authentication (email/password)
- Household onboarding (create/join)
- Expense management (CRUD)
- Category management
- Dashboard with expense widgets

### Known Issues
- Expenses are all "shared" - personal vs shared distinction not implemented
- No i18n yet (Italian only)
- PWA not configured

### Next Steps
See `CHANGELOG.md` for recent changes and the plan file for roadmap.

## Code Conventions

### Naming
- Components: PascalCase (`ExpenseForm.tsx`)
- Server Actions: camelCase (`createExpense`)
- Database tables: snake_case (`expense_categories`)

### Italian UI Text
The UI is currently in Italian. Key terms:
- Spese = Expenses
- Categorie = Categories
- Casa = House/Household
- Turni = Shifts/Chores
- Bollette = Bills

### Currency
Always format as EUR Italian locale:
```typescript
new Intl.NumberFormat("it-IT", {
  style: "currency",
  currency: "EUR",
}).format(amount);
```

## Troubleshooting

### RLS Recursion Error
If you see "infinite recursion detected in policy", the policy is referencing the same table. Use SECURITY DEFINER functions instead:
```sql
create or replace function public.get_user_household_ids()
returns setof uuid as $$
  select household_id from public.household_members where user_id = auth.uid();
$$ language sql security definer stable;
```

### Tailwind v4 PostCSS Error
Use `@tailwindcss/postcss` instead of `tailwindcss` in postcss.config.js.

## Links

- [Supabase Dashboard](https://supabase.com/dashboard)
- [Next.js Docs](https://nextjs.org/docs)
- [Tailwind CSS v4](https://tailwindcss.com/docs)
