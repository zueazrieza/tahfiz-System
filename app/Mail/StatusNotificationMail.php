<?php

namespace App\Mail;

use App\Models\Student;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class StatusNotificationMail extends Mailable
{
    use SerializesModels;

    public $student;
    public $statusType;
    public $customMessage;

    /**
     * Create a new message instance.
     */
    public function __construct(Student $student, string $statusType, string $customMessage = '')
    {
        $this->student = $student;
        $this->statusType = $statusType;
        $this->customMessage = $customMessage;
    }

    /**
     * Get the message envelope.
     */
    public function envelope(): Envelope
    {
        $subject = 'Kemaskini Status Permohonan - Akademi Al-Quran Amalillah';
        if ($this->statusType === 'ACCEPTED') {
            $subject = 'Tahniah! Permohonan Diterima (Lulus Temuduga) - Akademi Al-Quran Amalillah';
        } elseif ($this->statusType === 'REJECTED') {
            $subject = 'Keputusan Permohonan Pendaftaran - Akademi Al-Quran Amalillah';
        } elseif ($this->statusType === 'ENROLLED' || $this->statusType === 'Aktif') {
            $subject = 'Pendaftaran Pelajar Disahkan & Diaktifkan - Akademi Al-Quran Amalillah';
        }

        return new Envelope(
            subject: $subject,
        );
    }

    /**
     * Get the message content definition.
     */
    public function content(): Content
    {
        return new Content(
            view: 'emails.status_notification',
        );
    }

    /**
     * Get the attachments for the message.
     */
    public function attachments(): array
    {
        return [];
    }
}
