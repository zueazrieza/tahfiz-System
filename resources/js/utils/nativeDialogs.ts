/**
 * Override window.alert with a non-blocking toast notification.
 * window.confirm is left as native — it works in browser tabs and must return
 * a synchronous boolean, which a custom async dialog cannot replicate safely.
 *
 * Import installDialogOverrides() once in main.tsx.
 */

function injectStyles() {
  if (document.getElementById('__native-dialog-styles')) return;
  const style = document.createElement('style');
  style.id = '__native-dialog-styles';
  style.textContent = `
    #__toast-container {
      position: fixed;
      bottom: 24px;
      right: 24px;
      z-index: 99999;
      display: flex;
      flex-direction: column;
      gap: 10px;
      pointer-events: none;
      max-width: 380px;
    }
    .__toast {
      padding: 13px 18px;
      border-radius: 10px;
      font-size: 13.5px;
      font-weight: 500;
      color: #fff;
      min-width: 220px;
      box-shadow: 0 8px 28px rgba(0,0,0,0.22);
      animation: __toast-in 0.22s ease;
      pointer-events: all;
      line-height: 1.5;
      cursor: pointer;
      word-break: break-word;
    }
    @keyframes __toast-in {
      from { opacity: 0; transform: translateY(14px); }
      to   { opacity: 1; transform: translateY(0); }
    }
    .__toast-success { background: #16a34a; }
    .__toast-error   { background: #dc2626; }
    .__toast-info    { background: #2563eb; }
    .__toast-warn    { background: #d97706; }
  `;
  document.head.appendChild(style);
}

function getToastContainer(): HTMLElement {
  let el = document.getElementById('__toast-container');
  if (!el) {
    el = document.createElement('div');
    el.id = '__toast-container';
    document.body.appendChild(el);
  }
  return el;
}

/** Show a toast. Exported for direct use in components. */
export function showToast(
  message: string,
  type: 'success' | 'error' | 'info' | 'warn' = 'info',
  duration = 5000
) {
  injectStyles();
  const container = getToastContainer();
  const toast = document.createElement('div');
  toast.className = `__toast __toast-${type}`;
  toast.textContent = message;
  // Click to dismiss early
  toast.addEventListener('click', () => {
    toast.style.transition = 'opacity 0.2s';
    toast.style.opacity = '0';
    setTimeout(() => toast.remove(), 220);
  });
  container.appendChild(toast);
  setTimeout(() => {
    toast.style.transition = 'opacity 0.35s';
    toast.style.opacity = '0';
    setTimeout(() => toast.remove(), 380);
  }, duration);
}

/** Detect message tone to auto-pick toast type */
function detectType(msg: string): 'success' | 'error' | 'info' | 'warn' {
  if (/gagal|ralat|error|❌|salah|tidak berjaya|failed/i.test(msg)) return 'error';
  if (/berjaya|✅|selamat|saved|berjaya|disimpan|dikemaskini|dipadam|dihantar/i.test(msg)) return 'success';
  if (/⚠️|amaran|warn|perhatian/i.test(msg)) return 'warn';
  return 'info';
}

/** Install overrides. Call once at app startup in main.tsx. */
export function installDialogOverrides() {
  injectStyles();
  // Replace blocking alert() with a friendly toast
  window.alert = (message?: unknown) => {
    showToast(String(message ?? ''), detectType(String(message ?? '')));
  };
  // window.confirm is kept native — it returns a synchronous boolean
  // which a custom async dialog cannot replicate without breaking callers.
}
