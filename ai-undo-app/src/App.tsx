import { FormEvent, useState } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from './auth/AuthProvider';
import { getStoredRealm } from './auth/keycloak';
import { ChatBox } from './chat/ChatBox';

function LoadingScreen() {
  return (
    <main className="shell">
      <p className="muted">Checking session…</p>
    </main>
  );
}

function LoginPage() {
  const { ready, authenticated, login, error } = useAuth();
  const [realmInput, setRealmInput] = useState(getStoredRealm());
  const [busy, setBusy] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  if (!ready) {
    return <LoadingScreen />;
  }

  if (authenticated) {
    return <Navigate to="/chat" replace />;
  }

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setLocalError(null);
    try {
      await login(realmInput);
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : String(err));
      setBusy(false);
    }
  };

  return (
    <main className="shell login-shell">
      <section className="card">
        <h1>AI Undo</h1>
        <p className="muted">
          Sign in with the same Keycloak client as tenant-admin (
          <code>urn:ads:platform:tenant-admin-app</code>).
        </p>
        <form onSubmit={onSubmit} className="login-form">
          <label>
            Tenant name or realm UUID
            <input
              value={realmInput}
              onChange={(e) => setRealmInput(e.target.value)}
              placeholder="autotest"
              autoComplete="organization"
              required
            />
          </label>
          {(localError || error) && <div className="banner error">{localError || error}</div>}
          <button type="submit" disabled={busy || !realmInput.trim()}>
            {busy ? 'Redirecting…' : 'Sign in'}
          </button>
        </form>
      </section>
    </main>
  );
}

function ChatPage() {
  const { ready, authenticated, displayName, logout, getAccessToken, error } = useAuth();

  if (!ready) {
    return <LoadingScreen />;
  }

  if (!authenticated) {
    return <Navigate to="/" replace />;
  }

  return (
    <main className="shell chat-shell">
      <header className="topbar">
        <div>
          <h1>AI Undo</h1>
          <p className="muted">Signed in as {displayName || 'user'}</p>
        </div>
        <button type="button" className="ghost" onClick={() => void logout()}>
          Sign out
        </button>
      </header>
      {error ? <div className="banner error" style={{ margin: '0 0 0.75rem' }}>{error}</div> : null}
      <ChatBox getAccessToken={getAccessToken} />
    </main>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LoginPage />} />
      <Route path="/chat" element={<ChatPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
