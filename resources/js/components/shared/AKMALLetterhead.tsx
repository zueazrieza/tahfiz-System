interface LetterheadProps {
  docType?: string;
  meta?: string;
}

/**
 * Formal AKMAL letterhead — inline styles only so html2canvas captures correctly.
 * Uses table-cell layout (not flex) for reliable PDF rendering.
 */
export function AKMALLetterhead({ docType, meta }: LetterheadProps) {
  const today = new Date().toLocaleDateString('ms-MY', {
    day: 'numeric', month: 'long', year: 'numeric',
  });

  return (
    <div>
      {/* ── Top accent bar ── */}
      <div style={{ height: '5px', background: 'linear-gradient(to right, #0d3d40, #6FC7CB, #16a34a)' }} />

      {/* ── Header ── */}
      <div style={{ background: '#0d3d40', padding: '10px 20px' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <tbody>
            <tr>
              <td style={{ verticalAlign: 'middle' }}>
                <div style={{ color: '#fff', fontSize: '14px', fontWeight: 900, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: '3px' }}>
                  Akademi Al-Quran Amalillah (AKMAL)
                </div>
                <div style={{ color: '#9fd8db', fontSize: '8px', lineHeight: 1.8 }}>
                  Lot 2121, Jalan Tebakang, Kampung Tebakang, 21400 Bukit Payong, Terengganu<br />
                  Tel: 013-9482698 &nbsp;|&nbsp; E-mel: akademiakmal@gmail.com &nbsp;|&nbsp; No. Daftar: 202101039561 (1439861-X)
                </div>
              </td>
              <td style={{ verticalAlign: 'middle', textAlign: 'right', width: '72px' }}>
                <img
                  src="/images/logo.png"
                  alt="AKMAL"
                  style={{ height: '46px', objectFit: 'contain', display: 'block', marginLeft: 'auto' }}
                  onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
                />
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* ── Bottom accent ── */}
      <div style={{ height: '3px', background: 'linear-gradient(to right, #6FC7CB, #1a5c60, #16a34a)' }} />

      {/* ── Meta row: bismillah left / date+meta right ── */}
      <div style={{ padding: '5px 20px 0' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <tbody>
            <tr>
              <td style={{ fontSize: '9px', color: '#555', fontStyle: 'italic', verticalAlign: 'middle' }}>
                Bismillahirrahmanirrahim
              </td>
              <td style={{ fontSize: '9px', color: '#444', textAlign: 'right', verticalAlign: 'middle', lineHeight: 1.6 }}>
                Tarikh: <strong>{today}</strong>
                {meta && <div style={{ color: '#666', fontSize: '8.5px' }}>{meta}</div>}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* ── Document title ── */}
      {docType && (
        <div style={{
          textAlign: 'center', padding: '4px 20px 4px',
          fontSize: '11px', fontWeight: 900,
          textDecoration: 'underline', textTransform: 'uppercase',
          letterSpacing: '0.07em', color: '#0d3d40',
        }}>
          {docType}
        </div>
      )}

      {/* ── Rule ── */}
      <div style={{ borderBottom: '1px solid #d0d0d0', margin: '0 20px 10px' }} />
    </div>
  );
}

export function AKMALLetterFooter() {
  return (
    <div style={{ marginTop: '18px' }}>
      <div style={{ borderTop: '2px solid #0d3d40' }} />
      <div style={{ background: '#0d3d40', padding: '7px 20px' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <tbody>
            <tr>
              <td style={{ color: '#9fd8db', fontStyle: 'italic', fontSize: '10px', fontWeight: 600, verticalAlign: 'middle' }}>
                Setahun Menempa Sejarah — AKMAL
              </td>
              <td style={{ textAlign: 'right', color: '#a8d8db', fontSize: '8px', verticalAlign: 'middle', lineHeight: 1.6 }}>
                <div style={{ fontWeight: 700 }}>AKMAL — Sistem Pengurusan Tahfiz</div>
                <div>Dokumen ini dijana secara elektronik dan sah.</div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
