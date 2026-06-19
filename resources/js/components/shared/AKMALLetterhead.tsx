interface LetterheadProps {
  docType?: string;
  meta?: string;
}

/** Full AKMAL official letterhead – uses inline styles so html2canvas captures it correctly */
export function AKMALLetterhead({ docType, meta }: LetterheadProps) {
  const today = new Date().toLocaleDateString('ms-MY', { day: 'numeric', month: 'long', year: 'numeric' });
  return (
    <div>
      {/* ── Top dark-teal header bar ── */}
      <div style={{
        background: 'linear-gradient(135deg, #0d3d40 0%, #1a5c60 60%, #0d4548 100%)',
        padding: '14px 22px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}>
        {/* Left: org name + contact */}
        <div>
          <div style={{ color: '#ffffff', fontSize: '18px', fontWeight: 900, letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: '6px' }}>
            AKADEMI AL-QURAN AMALILLAH
          </div>
          <div style={{ color: '#a8d8db', fontSize: '9.5px', lineHeight: 1.9 }}>
            <span>📍 Lot 2121, Jalan Tebakang, Kampung Tebakang, 21400 Bukit Payong, Terengganu</span>
            <br />
            <span>📞 013-9482698 &nbsp;&nbsp; ✉ akademiakmal@gmail.com</span>
          </div>
        </div>
        {/* Right: logo + reg no */}
        <div style={{ textAlign: 'center', minWidth: '96px' }}>
          <img
            src="/images/logo.png"
            alt="AKMAL"
            style={{ height: '62px', objectFit: 'contain', display: 'block', margin: '0 auto 4px' }}
            onError={e => ((e.target as HTMLElement).style.display = 'none')}
          />
          <div style={{ color: '#ffffff', fontSize: '9px', fontWeight: 800, lineHeight: 1.5 }}>AKMAL</div>
          <div style={{ color: '#ffffff', fontSize: '8px', fontWeight: 700 }}>AKADEMI AL-QURAN AMALILLAH</div>
          <div style={{ color: '#a8d8db', fontSize: '8px', marginTop: '2px' }}>202101039561</div>
          <div style={{ color: '#a8d8db', fontSize: '8px' }}>(1439861-X)</div>
        </div>
      </div>

      {/* ── Gradient separator line ── */}
      <div style={{ height: '4px', background: 'linear-gradient(to right, #6FC7CB, #1a5c60, #16a34a)' }} />

      {/* ── Tarikh + optional meta (right-aligned) ── */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '8px 22px 2px', fontSize: '10px', color: '#444' }}>
        <div style={{ textAlign: 'right' }}>
          <div>Tarikh: <b>{today}</b></div>
          {meta && <div style={{ marginTop: '1px', color: '#666' }}>{meta}</div>}
        </div>
      </div>

      {/* ── Bismillah ── */}
      <div style={{ textAlign: 'center', fontSize: '17px', padding: '5px 0 3px', fontFamily: 'Georgia, "Times New Roman", serif', direction: 'rtl', letterSpacing: '0.04em', color: '#1a1a1a' }}>
        بِسْمِ اللّٰهِ الرَّحْمٰنِ الرَّحِيْمِ
      </div>

      {/* ── Document type title ── */}
      {docType && (
        <div style={{ textAlign: 'center', padding: '4px 22px 6px', fontSize: '12px', fontWeight: 800, textDecoration: 'underline', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#0d3d40' }}>
          {docType}
        </div>
      )}

      {/* ── Thin rule ── */}
      <div style={{ borderBottom: '1.5px solid #dde1e4', margin: '0 22px 14px' }} />
    </div>
  );
}

export function AKMALLetterFooter() {
  return (
    <div style={{ marginTop: '24px' }}>
      <div style={{ borderTop: '2px solid #1a5c60' }} />
      <div style={{
        background: 'linear-gradient(135deg, #0d3d40, #1a5c60)',
        padding: '10px 22px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}>
        <div style={{ color: '#9fd8db', fontStyle: 'italic', fontSize: '12px', fontWeight: 600 }}>
          Setahun Menempa Sejarah ✦
        </div>
        <div style={{ color: '#a8d8db', fontSize: '9px', textAlign: 'right' }}>
          <div style={{ fontWeight: 700 }}>AKMAL — Sistem Pengurusan Tahfiz</div>
          <div>Dokumen ini dijana secara elektronik dan sah.</div>
        </div>
      </div>
    </div>
  );
}
