<?php

namespace App\Exports;

use App\Models\ParentProfile;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;
use Maatwebsite\Excel\Concerns\WithStyles;
use Maatwebsite\Excel\Concerns\ShouldAutoSize;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;

class ParentsExport implements FromCollection, WithHeadings, WithMapping, WithStyles, ShouldAutoSize
{
    public function collection()
    {
        return ParentProfile::with(['user', 'students.classRoom'])->get();
    }

    public function headings(): array
    {
        return [
            'No.',
            'Hubungan',
            'Nama Penuh',
            'No. IC',
            'No. Telefon',
            'Pekerjaan',
            'Sektor',
            'Pendapatan Bulanan (RM)',
            'No. Tel Pejabat',
            'Jumlah Anak',
            'Nama Anak & Kelas',
            'Rujukan',
            'Alamat',
            'Poskod',
            'Bandar',
            'Daerah',
            'Negeri',
            'Negara',
            'Parlimen',
        ];
    }

    public function map($parent): array
    {
        $children = $parent->students->map(function ($s) {
            $kelas = $s->classRoom->name ?? 'N/A';
            return $s->name . ' (' . $kelas . ')';
        })->implode(', ');

        return [
            $parent->id,
            ucfirst($parent->relationship_type ?? '—'),
            $parent->user->full_name ?? $parent->user->name ?? 'N/A',
            $parent->ic_no ?? '—',
            $parent->phone ?? '—',
            $parent->occupation ?? '—',
            $parent->sector ?? '—',
            $parent->income ?? '0.00',
            $parent->office_phone ?? '—',
            $parent->students->count(),
            $children ?: '—',
            $parent->reference ?? '—',
            $parent->address ?? '—',
            $parent->postcode ?? '—',
            $parent->city ?? '—',
            $parent->district ?? '—',
            $parent->state_name ?? '—',
            $parent->country ?? '—',
            $parent->parliament ?? '—',
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
