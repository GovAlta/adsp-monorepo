import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import {
  getAccessToken as fetchAccessToken,
  getKeycloak,
  getStoredRealm,
  initKeycloak,
  login as keycloakLogin,
  logout as keycloakLogout,
  resolveRealm,
} from './keycloak';

interface AuthState {
  ready: boolean;
  authenticated: boolean;
  realm: string;
  displayName: string | null;
  error: string | null;
  login: (realmInput: string) => Promise<void>;
  logout: () => Promise<void>;
  getAccessToken: () => Promise<string>;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);
  const [realm, setRealm] = useState(getStoredRealm());
  const [displayName, setDisplayName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const stored = getStoredRealm();
        const resolved = await resolveRealm(stored);
        const kc = await initKeycloak(resolved);
        if (cancelled) {
          return;
        }
        setRealm(stored);
        setAuthenticated(Boolean(kc.authenticated));
        setDisplayName(
          (kc.tokenParsed?.['name'] as string | undefined) ||
            (kc.tokenParsed?.['preferred_username'] as string | undefined) ||
            null,
        );
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : String(err));
        }
      } finally {
        if (!cancelled) {
          setReady(true);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const login = useCallback(async (realmInput: string) => {
    setError(null);
    try {
      await keycloakLogin(realmInput);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      throw err;
    }
  }, []);

  const logout = useCallback(async () => {
    setError(null);
    await keycloakLogout();
  }, []);

  const value = useMemo<AuthState>(
    () => ({
      ready,
      authenticated,
      realm,
      displayName,
      error,
      login,
      logout,
      getAccessToken: async () => {
        getKeycloak();
        return fetchAccessToken();
      },
    }),
    [ready, authenticated, realm, displayName, error, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return ctx;
}
