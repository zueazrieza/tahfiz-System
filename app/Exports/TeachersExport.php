<?php

namespace App\Exports;

use App\Models\Teacher;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;
use Maatwebsite\Excel\Concerns\WithStyles;
use Maatwebsite\Excel\Concerns\ShouldAutoSize;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;

class TeachersExport implements FromCollection, WithHeadings, WithMapping, WithStyles, ShouldAutoSize
{
    public function collection()
    {
        return Teacher::with('user')->get();
    }

    public function headings(): array
    {
        return [
            'ID',
            'Nama Penuh',
            'Emel',
            'No. Telefon',
            'No. IC',
            'Jantina',
            'Kepakaran',
            'Kelayakan',
            'Pengalaman (Tahun)',
            'Tarikh Mula Perkhidmatan',
            'Sejarah Kesihatan',
            'Bilangan Tanggungan',
            'Alamat Kediaman',
            'Nama Kecemasan',
            'No. Tel Kecemasan',
        ];
    }

    public function map($teacher): array
    {
        return [
            $teacher->id,
            $teacher->name,
            $teacher->email ?? $teacher->user?->email ?? '',
            $teacher->phone,
            $teacher->ic_no,
            $teacher->gender === 'F' ? 'Perempuan (Murabbiah)' : 'Lelaki (Murabbi)',
            $teacher->specialization,
            $teacher->qualification,
            $teacher->experience,
            $teacher->service_start_date,
            $teacher->medical_history,
            $teacher->dependents_count,
            $teacher->residence,
            $teacher->emergency_contact_name,
            $teacher->emergency_contact_phone,
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
