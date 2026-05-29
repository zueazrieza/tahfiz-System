# Test Credentials — Tahfiz Management System

All seeded by `database/seeders/DatabaseSeeder.php`. Password is `password` for every user.

| Role    | Email                | Password   |
|---------|----------------------|------------|
| Admin   | admin@tahfiz.com     | password   |
| Teacher | ustaz@tahfiz.com     | password   |
| Parent  | waris@example.com    | password   |
| Student | pelajar@example.com  | password   |

## URLs
- Public landing: `https://<preview-url>/`
- React SPA entry: `https://<preview-url>/app/login`
- API base: `https://<preview-url>/api`
- CSRF cookie: `GET /api/csrf-cookie`
- Login: `POST /api/login` (requires `X-XSRF-TOKEN`, `X-Requested-With: XMLHttpRequest`)

## Re-seed
```
cd /app && php artisan migrate:fresh --seed --force
```
