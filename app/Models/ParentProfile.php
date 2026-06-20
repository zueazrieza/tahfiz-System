<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ParentProfile extends Model
{
    use HasFactory;

    protected $table = 'parents';

    protected $fillable = [
        'user_id',
        'ic_no',
        'occupation',
        'income',
        'address',
        'phone',
        'relationship_type',
        'postcode',
        'city',
        'district',
        'state_name',
        'country',
        'parliament',
        'sector',
        'office_phone',
        'child_count',
        'reference',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function students()
    {
        return $this->belongsToMany(Student::class, 'student_parent', 'parent_id', 'student_id');
    }
}
