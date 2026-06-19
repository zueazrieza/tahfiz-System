<?php

namespace App\Mail;

use App\Models\Student;
use App\Models\HafazanRecord;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class HafazanRecordedMail extends Mailable
{
    use SerializesModels;

    public $student;
    public $record;
    public $parentName;

    public function __construct(Student $student, HafazanRecord $record, string $parentName)
    {
        $this->student    = $student;
        $this->record     = $record;
        $this->parentName = $parentName;
    }

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Rekod Hafazan ' . $this->student->name . ' – ' . $this->record->date,
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.hafazan_recorded',
        );
    }

    public function attachments(): array
    {
        return [];
    }
}
