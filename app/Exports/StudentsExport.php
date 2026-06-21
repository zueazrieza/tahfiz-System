<?php

namespace App\Exports;

use App\Models\Student;
use Carbon\Carbon;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;
use Maatwebsite\Excel\Concerns\WithStyles;
use Maatwebsite\Excel\Concerns\ShouldAutoSize;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;

class StudentsExport implements FromCollection, WithHeadings, WithMapping, WithStyles, ShouldAutoSize
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
            'UMUR',
            'ALAMAT',
            'KELAS',
            'NAMA MURABBI',
            'TARIKH DAFTAR',
            'TARIKH TAMAT',
            'STATUS',
            'STATUS KHATAM',
            'INTAKE',
            'BATCH',
            'NAMA BAPA',
            'NO IC BAPA',
            'NAMA IBU',
            'NO IC IBU',
            'NAMA PENJAGA (SISTEM)',
            'TELEFON PENJAGA',
            'SEJARAH KESIHATAN',
            'BIL JUZUK',
            'RANKING',
            'JUZUK SEMASA',
            'PURATA SABAQ/HARI',
            'JENIS BACAAN',
            'TARGET JUZUK',
            'TEMPOH KHATAM',
            'BILANGAN HARI',
            'TARIKH MULA',
            'TARIKH KHATAM',
        ];
    }

    public function map($student): array
    {
        $className  = $student->classRoom->name ?? '';
        $murabbi    = $student->classRoom->primaryTeacher->name ?? '';
        $prediction = $student->aiPrediction;

        $father = $student->parents->firstWhere('relationship_type', 'father');
        $mother = $student->parents->firstWhere('relationship_type', 'mother');

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
            $student->gender === 'F' ? 'Perempuan' : 'Lelaki',
            $student->dob,
            $student->age,
            $student->address,
            $className,
            $murabbi,
            $student->enrolled_date,
            $student->tarikh_tamat,
            $student->status,
            $student->status_khatam,
            $student->intake,
            $student->batch,
            $father?->user?->full_name ?? $father?->user?->name ?? '',
            $father?->ic_no ?? '',
            $mother?->user?->full_name ?? $mother?->user?->name ?? '',
            $mother?->ic_no ?? '',
            $student->parent_name,
            $student->parent_phone,
            $student->medical_history,
            $student->juzuk_completed,
            $student->ranking,
            $student->juzuk_semasa,
            $student->purata_sabaq_sehari,
            $student->jenis_bacaan,
            $student->target_bil_juzuk,
            $tempohKhatam,
            $bilHari,
            $tarikhMula,
            $tarikhKhatam,
        ];
    }

    public function styles(Worksheet $sheet): array
    {
        return [
            1 => [
                'font'      => ['bold' => true, 'color' => ['argb' => 'FFFFFFFF']],
                'fill'      => ['fillType' => 'solid', 'startColor' => ['argb' => 'FF2D6A8F']],
                'alignment' => ['horizontal' => 'center'],
            ],
        ];
    }
}
