# database/scripts — CLI-only maintenance scripts

These scripts **must only be run from the CLI** (`php database/scripts/script.php`).
They are intentionally stored outside the web root (`public/`) and outside any
`Route::` definition so they are **never publicly accessible**.

| Script | Purpose |
|---|---|
| `final_fix.php` | One-off data fix (legacy) |
| `fix_parent_links.php` | Repairs student–parent pivot links |
| `global_linker.php` | Links users to their profiles |
| `migrate_profiles.php` | Migrates old profile format |
| `reset_academic_data.php` | ⚠️ Wipes academic data — destructive |
| `run_migrations.php` | Manual migration runner (use `php artisan migrate` instead) |

> [!CAUTION]
> `reset_academic_data.php` is **destructive**. Never run it on production data without a backup.
