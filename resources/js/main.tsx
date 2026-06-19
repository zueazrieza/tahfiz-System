import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import { AppProvider } from './store/AppContext.tsx';
import '../css/styles/index.css';
import axios from 'axios';
import { installDialogOverrides } from './utils/nativeDialogs';

// ── Ensure Axios always sends the session cookie ───────────────────────────
axios.defaults.withCredentials = true;

// ── Replace blocking window.alert() with toast notifications ──────────────
installDialogOverrides();

// ── On tab-switch back: silently re-verify session (no hard reload) ────────
// Replaces the destructive window.location.reload() on pageshow.
document.addEventListener('visibilitychange', async () => {
  if (document.visibilityState === 'visible') {
    try {
      const r = await axios.get('/api/me');
      if (!r.data.user) {
        // Session expired — redirect cleanly without blowing away history
        window.location.replace('/app/role-selection');
      }
    } catch {
      // Network error or 401 — redirect
      window.location.replace('/app/role-selection');
    }
  }
});

const container = document.getElementById('root');

if (container) {
  const root = createRoot(container);
  root.render(
    <React.StrictMode>
      <AppProvider>
        <App />
      </AppProvider>
    </React.StrictMode>
  );
}
