<?php
use App\Models\User;
use App\Models\Student;

$parent = User::where('name', 'like', '%Ali Uzair%')->first();
if ($parent) {
    // Update children to point to this parent ID
    $affected = Student::where('parent_name', 'like', '%Ali Uzair%')->update(['parent_id' => $parent->id]);
    echo "Successfully linked $affected children to Parent ID: {$parent->id}\n";
    
    // Also update parent username to IC if we can find it in the student records
    $student = Student::where('parent_id', $parent->id)->first();
    if ($student && $parent->name != $student->parent_ic) {
        $parent->name = $parent->email; // Fallback or use real IC if available
        // Actually, the user wants username = IC.
        // I don't have parent_ic in Student model yet? 
        // Wait, looking at migration: I don't have a dedicated parent_ic column in students table.
        // It was used in StudentsImport logic but not stored?
        // Ah! and I should store it.
    }
} else {
    echo "Parent not found.\n";
}
