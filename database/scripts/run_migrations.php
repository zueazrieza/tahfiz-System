<?php
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\DB;

require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

$migrations = DB::table('migrations')->pluck('migration')->toArray();
$files = glob(database_path('migrations/*.php'));

foreach ($files as $file) {
    $name = basename($file, '.php');
    if (!in_array($name, $migrations)) {
        echo "Attempting to migrate: $name\n";
        try {
            Artisan::call('migrate', [
                '--path' => 'database/migrations/' . basename($file),
                '--force' => true
            ]);
            echo Artisan::output();
        } catch (\Exception $e) {
            echo "ERROR in $name: " . $e->getMessage() . "\n";
        }
    }
}
