export const LOGIN_RETURN_TO_KEY = 'loginRedirectTo';

export const ssoFailureLocation = (realm: string | null | undefined): string => {
  if (!realm) {
    return '/';
  }
  return `/${encodeURIComponent(realm)}/login`;
};

export const rememberAdminLocation = (pathWithSearch: string): void => {
  if (pathWithSearch.startsWith('/admin')) {
    sessionStorage.setItem(LOGIN_RETURN_TO_KEY, pathWithSearch);
  }
};

// Sends the user through tenant login and back to the current admin page. Returns false (no redirect)
// outside of the admin area so public pages keep their existing behaviour.
export const reauthenticateToCurrentLocation = (
  realm: string | null | undefined,
  navigate: (url: string) => void = (url) => window.location.replace(url),
): boolean => {
  const current = `${window.location.pathname}${window.location.search}`;
  if (!realm || !current.startsWith('/admin')) {
    return false;
  }
  rememberAdminLocation(current);
  navigate(ssoFailureLocation(realm));
  return true;
};

export const takeAdminReturnLocation = (realm: string): string => {
  const stored = sessionStorage.getItem(LOGIN_RETURN_TO_KEY);
  sessionStorage.removeItem(LOGIN_RETURN_TO_KEY);
  if (stored?.startsWith('/admin')) {
    const url = new URL(stored, window.location.origin);
    url.searchParams.set('realm', realm);
    return `${url.pathname}${url.search}`;
  }
  return `/admin?realm=${realm}`;
};
