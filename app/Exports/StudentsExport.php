<?php

namespace App\Exports;

use App\Models\Student;
use Carbon\Carbon;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;

class StudentsExport implements FromCollection, WithHeadings, WithMapping
{
    public function collection()
    {
        return Student::with(['classRoom.primaryTeacher', 'parents', 'aiPrediction'])->get();
    }

    public function headings(): array
    {
        return [
            'NAMA PELAJAR',
            'NO MATRIK',
            'NO IC PELAJAR',
            'JANTINA',
            'TARIKH LAHIR',
            'KELAS 2026',
            'HALAQAH KELAS',
            'TARIKH DAFTAR',
            'TARIKH TAMAT',
            'STATUS',
            'INTAKE',
            'NAMA BAPA',
            'NO IC BAPA',
            'NAMA IBU',
            'NO IC IBU',
            'BIL JUZUK',
            'RANKING',
            'JUZUK SEMASA',
            'PURATA SABAQ/HARI',
            'JENIS BACAAN',
            'TARGET JUZUK',
            'UMUR',
            'BATCH',
            'TEMPOH KHATAM',
            'BILANGAN HARI',
            'TARIKH MULA',
            'TARIKH KHATAM',
            'NAMA MURABBI',
            'STATUS KHATAM',
        ];
    }

    public function map($student): array
    {
        $className  = $student->classRoom->name ?? '';
        $murabbi    = $student->classRoom->primaryTeacher->name ?? '';
        $prediction = $student->aiPrediction;

        $father = $student->parents->firstWhere('relationship_type', 'father');
        $mother = $student->parents->firstWhere('relationship_type', 'mother');

        // Computed khatam fields
        $tarikhKhatam  = $prediction?->estimated_completion;
        $tarikhMula    = $student->enrolled_date;
        $bilHari       = null;
        $tempohKhatam  = null;

        if ($tarikhKhatam) {
            $mula  = $tarikhMula ? Carbon::parse($tarikhMula) : Carbon::now();
            $tamat = Carbon::parse($tarikhKhatam);
            $bilHari      = max(0, (int) Carbon::now()->diffInDays($tamat, false));
            $tempohKhatam = $mula->diffForHumans($tamat, true);
        }

        return [
            $student->name,
            $student->matric_no,
            $student->ic_no,
            $student->gender,
            $student->dob,
            $className,
            $className,
            $student->enrolled_date,
            $student->tarikh_tamat,
            $student->status,
            $student->intake,
            $father?->user?->full_name ?? '',
            $father?->ic_no ?? '',
            $mother?->user?->full_name ?? '',
            $mother?->ic_no ?? '',
            $student->juzuk_completed,
            $student->ranking,
            $student->juzuk_semasa,
            $student->purata_sabaq_sehari,
            $student->jenis_bacaan,
            $student->target_bil_juzuk,
            $student->age,
            $student->batch,
            $tempohKhatam,
            $bilHari,
            $tarikhMula,
            $tarikhKhatam,
            $murabbi,
            $student->status_khatam,
        ];
    }
}
