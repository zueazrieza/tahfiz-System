# Tahfiz Management System (AKMAL) — PRD

## Original Problem
"Check the lack so we can run it smoothly" — user delivered a Laravel 12 + React 19 (Vite SPA) school management codebase that wasn't running. PHP, Composer, deps, env, DB and supervisor wiring were all missing.

## Stack
- Backend: Laravel 12 (PHP 8.4), SQLite, Sanctum
- Frontend: React 19 + TypeScript + Vite + Tailwind v4 (built into `public/build`)
- Other: dompdf, maatwebsite/excel, recharts, qrcode.react

## What's Been Implemented (2026-05-28)
- Installed PHP 8.4 (Sury repo), Composer, all PHP extensions (sqlite3, mbstring, xml, zip, bcmath, gd, intl, mysql, tokenizer, fileinfo)
- `composer install` — 92 packages installed
- Generated `APP_KEY`, set `APP_URL` and `ASSET_URL` to the preview HTTPS URL, set `FORCE_HTTPS=true`
- Patched `AppServiceProvider::boot()` to call `URL::forceScheme('https')` when `FORCE_HTTPS=true` (fixes mixed-content blocking under reverse proxy)
- Created SQLite DB (`database/database.sqlite`), ran all 47 migrations
- Seeded 4 demo users (admin / teacher / parent / student) + teachers
- `yarn install` + added `react-is@^19` (peer dep for recharts) + `npm run build` produced production assets in `public/build/`
- New supervisor config at `/etc/supervisor/conf.d/laravel.conf`:
  - `laravel-api` → `php artisan serve` on port 8001 (serves /api/*)
  - `laravel-web` → `php artisan serve` on port 3000 (serves /, /login, /app/*)
  - Vite HMR program kept but disabled by default (use `yarn dev` manually for hot-reload)
- Default `backend` / `frontend` supervisor programs (FastAPI / CRA) marked FATAL — harmless, expected.

## Verified Working
- `GET /` → 200, AKMAL landing page renders fully
- `GET /api/csrf-cookie` → returns token JSON
- `POST /api/login` → reachable, returns proper validation errors
- `GET /app/login` → React SPA mounts, dashboard role-picker renders with full Tailwind styles

## Seeded Credentials (password = `password` for all)
- admin@tahfiz.com (admin)
- ustaz@tahfiz.com (teacher)
- waris@example.com (parent)
- pelajar@example.com (student)

## Backlog / Next Tasks
- P1: Some web routes use blade auth (`/login`) — confirm whether to keep dual auth (blade + SPA API)
- P1: 5 leftover one-off PHP scripts in repo root (`final_fix.php`, `fix_parent_links.php`, `global_linker.php`, `migrate_profiles.php`, `reset_academic_data.php`, `run_migrations.php`) — review/remove
- P2: Wire up real email driver (currently `MAIL_MAILER=log`) for enrollment / interview / offer-letter mails
- P2: Add `npm run dev` HMR workflow (Vite dev server needs HTTPS proxy because the platform ingress blocks `http://`)
- P2: Bundle size: main chunk is 2 MB — add manualChunks / lazy routes
