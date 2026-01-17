# Changelog

All notable changes to Housy will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

---

## [Unreleased]

### Planned
- Distinguish personal vs shared expenses
- i18n support (Italian + English)
- PWA configuration
- Chores/tasks with points system
- Telegram bot integration
- Email parsing for bills

---

## [0.2.0] - 2025-01-17

### Added
- **Household Management**
  - Onboarding wizard to create or join a household
  - Invite code system for joining existing households
  - Household name displayed in sidebar

- **Expense Management**
  - Full CRUD for expenses (create, read, update, delete)
  - Expense list with responsive table (desktop) and cards (mobile)
  - Expense form with amount, description, category, date
  - Only expense owner can edit/delete their expenses

- **Category Management**
  - CRUD for expense categories
  - Color picker for category customization
  - Default categories created on household creation:
    - Spesa alimentare (green)
    - Bollette (amber)
    - Trasporti (blue)
    - Casa (violet)
    - Svago (pink)
    - Altro (gray)

- **Dashboard Improvements**
  - Real expense data in stats cards
  - Recent expenses widget (last 5)
  - Spending by category with progress bars
  - Monthly totals

- **Database Functions**
  - `create_household_with_admin()` - Atomic household creation
  - `join_household_with_code()` - Join via invite code
  - `ensure_user_exists()` - Ensure user profile exists
  - `get_user_household_ids()` - Get user's households (SECURITY DEFINER)
  - `is_household_admin()` - Check admin status (SECURITY DEFINER)

### Fixed
- **RLS Infinite Recursion**: Fixed policies that caused "infinite recursion detected" error by using SECURITY DEFINER functions
- **Household Creation RLS**: Fixed "new row violates row-level security policy" by using atomic database functions

### Changed
- Server actions now use RPC calls for household operations instead of direct inserts
- Middleware checks for household membership and redirects to onboarding

---

## [0.1.0] - 2025-01-17

### Added
- **Project Setup**
  - Next.js 16 with App Router
  - TypeScript configuration
  - Tailwind CSS v4 with `@tailwindcss/postcss`

- **Authentication**
  - Supabase Auth integration
  - Login page with email/password
  - Register page with name, email, password
  - Protected routes via middleware

- **Dashboard Layout**
  - Responsive sidebar navigation
  - Header with user info
  - Mobile-friendly hamburger menu

- **Database Schema**
  - Complete PostgreSQL schema for Supabase
  - Tables: users, households, household_members, expenses, expense_categories, waste_schedules, recurring_bills, chores, telegram_groups, telegram_link_codes
  - Row Level Security policies
  - Trigger for automatic user profile creation

### Fixed
- **Tailwind CSS v4 Error**: Fixed "Cannot find module tailwindcss" by using `@tailwindcss/postcss` plugin
- **SQL Schema Order**: Fixed circular reference errors by creating tables first, then enabling RLS, then creating policies

---

## File Changes Summary

### Phase 1 (v0.1.0)
```
Created:
├── src/app/(auth)/login/page.tsx
├── src/app/(auth)/register/page.tsx
├── src/app/(dashboard)/layout.tsx
├── src/app/(dashboard)/dashboard/page.tsx
├── src/components/ui/Sidebar.tsx
├── src/components/ui/Header.tsx
├── src/lib/supabase/client.ts
├── src/lib/supabase/server.ts
├── src/lib/supabase/middleware.ts
├── src/middleware.ts
└── supabase/schema.sql
```

### Phase 2 (v0.2.0)
```
Created:
├── src/app/onboarding/page.tsx
├── src/app/actions/household.ts
├── src/app/actions/expenses.ts
├── src/app/actions/categories.ts
├── src/app/(dashboard)/spese/page.tsx
├── src/app/(dashboard)/spese/nuova/page.tsx
├── src/app/(dashboard)/spese/[id]/page.tsx
├── src/app/(dashboard)/spese/categorie/page.tsx
├── src/components/expenses/ExpenseForm.tsx
├── src/components/expenses/ExpenseList.tsx
├── supabase/fix-policies.sql
└── supabase/fix-policies-v2.sql

Modified:
├── src/middleware.ts (household check)
├── src/app/(dashboard)/layout.tsx (pass household to sidebar)
├── src/app/(dashboard)/dashboard/page.tsx (real expense data)
└── src/components/ui/Sidebar.tsx (show household name)
```

---

## Migration Notes

### Supabase Schema Updates

If upgrading from v0.1.0, run these SQL scripts in order:
1. `supabase/fix-policies.sql` - Fixes RLS recursion
2. `supabase/fix-policies-v2.sql` - Adds SECURITY DEFINER functions

### Breaking Changes

None yet.
