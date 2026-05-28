<?php
use App\Models\User;
use App\Models\Student;

echo "Starting data correction...\n";

// 1. Fix Parent Usernames to IC
$parents = User::where('role', 'parent')->get();
foreach ($parents as $u) {
    $ic = explode('@', $u->email)[0];
    if (is_numeric($ic) || strlen($ic) > 10) {
        $u->name = $ic;
        $u->save();
        echo "Updated User ID {$u->id} username to IC: $ic\n";
    }
}

// 2. Link children for Ali Uzair specifically for testing
$ali = User::where('name', '811130015501')->first() ?? User::where('email', 'like', '%811130015501%')->first();
if ($ali) {
    $affected = Student::where('parent_name', 'like', '%Ali Uzair%')->update(['parent_id' => $ali->id]);
    echo "Linked $affected children to Ali Uzair (ID: {$ali->id})\n";
} else {
    // Try to find any parent to link for demonstration if Ali IC not matched
    $anyParent = User::where('role', 'parent')->first();
    if ($anyParent) {
        Student::where('parent_name', 'like', '%Ali Uzair%')->update(['parent_id' => $anyParent->id]);
        echo "Linked Ali Uzair children to Parent ID: {$anyParent->id} (Fall-back)\n";
    }
}

echo "Correction complete.\n";
