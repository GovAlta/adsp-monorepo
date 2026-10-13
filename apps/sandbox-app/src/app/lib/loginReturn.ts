const RETURN_TO_PARAM = 'returnTo';

export function isServicesUrl(path: string): boolean {
  return /\/services(\/.*)?$/.test(path);
}

export function buildLoginPath(tenantName: string, returnTo: string): string {
  return `/${tenantName}/login?${RETURN_TO_PARAM}=${encodeURIComponent(returnTo)}`;
}

// Only pages inside the tenant are allowed, so a crafted login link cannot send the user to another site.
export function getLoginReturnPath(tenantName: string, search: string | undefined): string {
  const tenantPrefix = `/${tenantName}/`;
  const returnTo = new URLSearchParams(search).get(RETURN_TO_PARAM);
  if (returnTo?.startsWith(tenantPrefix) && !returnTo.startsWith(`${tenantPrefix}login`)) {
    return returnTo;
  }
  return `${tenantPrefix}services`;
}
