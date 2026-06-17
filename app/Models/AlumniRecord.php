<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AlumniRecord extends Model
{
    protected $fillable = ['name','start_date','khatam_date','murabbi_name','matric_no','ic_no','address','duration_days'];
}
