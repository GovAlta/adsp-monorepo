import z from 'zod';
import type { AccessClientDetails } from './clientView';
import type { AccessEnvironmentId } from './environments';

/**
 * Plain-language checks of a client's setup against ADSP guidance, and of whether a web address is allowed as its
 * sign-in return address, browser origin and sign-out return address, matched the way Keycloak matches them.
 */

export const clientFindingSchema = z.object({
  id: z.string(),
  severity: z.enum(['problem', 'warning', 'tip']),
  title: z.string(),
  fix: z.string(),
});

export type ClientFinding = z.infer<typeof clientFindingSchema>;

export interface ClientSetupFacts {
  client: AccessClientDetails;
  environmentId: AccessEnvironmentId;
  /** Client roles held by the client's service account, when it has one and they could be read. */
  serviceAccountClientRoleCount?: number;
  secretCreatedAt?: Date;
  now?: Date;
}

const LOOPBACK_HOSTS = new Set(['localhost', '127.0.0.1']);
const SEVERITY_ORDER: Record<ClientFinding['severity'], number> = { problem: 0, warning: 1, tip: 2 };
const SECRET_AGE_TIP_DAYS = 365;
const DAY_MS = 24 * 60 * 60 * 1000;

function hostOf(uri: string): string | undefined {
  try {
    return new URL(uri.replace(/\*$/, '')).hostname;
  } catch {
    return undefined;
  }
}

function redirectFindings(client: AccessClientDetails, environmentId: AccessEnvironmentId): ClientFinding[] {
  const findings: ClientFinding[] = [];
  const { redirectUris } = client.redirects;

  const anyAddress = redirectUris.filter((uri) => uri === '*' || uri === '/*');
  if (anyAddress.length > 0) {
    findings.push({
      id: 'wildcard-redirect',
      severity: 'problem',
      title: `Any address is allowed as a sign-in return address (${anyAddress.join(', ')}), so a sign-in could be sent to someone else's site.`,
      fix: "Replace it with your app's own address, for example https://my-app.alberta.ca/*.",
    });
  }

  const misplacedWildcard = redirectUris.filter((uri) => uri.slice(0, -1).includes('*'));
  if (misplacedWildcard.length > 0) {
    findings.push({
      id: 'misplaced-wildcard',
      severity: 'problem',
      title: `Keycloak only supports * at the very end of a redirect URI, so ${misplacedWildcard.join(', ')} never matches.`,
      fix: 'List each address separately, with * only at the end, for example https://app.alberta.ca/*.',
    });
  }

  const relative = redirectUris.filter((uri) => uri.startsWith('/') && uri !== '/*');
  if (relative.length > 0 && !client.urls.root) {
    findings.push({
      id: 'relative-without-root',
      severity: 'problem',
      title: `${relative.join(', ')} is a relative address, but the client has no Root URL to complete it.`,
      fix: "Set the client's Root URL to your app's address, or use full addresses.",
    });
  }

  const insecure = redirectUris.filter((uri) => uri.startsWith('http://') && !LOOPBACK_HOSTS.has(hostOf(uri) ?? ''));
  if (insecure.length > 0) {
    findings.push({
      id: 'http-redirect',
      severity: 'warning',
      title: `${insecure.join(', ')} uses http instead of https.`,
      fix: 'Use https for every address except localhost.',
    });
  }

  const loopback = redirectUris.filter((uri) => LOOPBACK_HOSTS.has(hostOf(uri) ?? ''));
  if (loopback.length > 0 && (environmentId === 'uat' || environmentId === 'prod')) {
    findings.push({
      id: 'localhost-redirect',
      severity: 'warning',
      title: `Local development addresses (${loopback.join(', ')}) are allowed in this environment.`,
      fix: 'Remove localhost addresses outside Development; keep a separate client for local work.',
    });
  }

  return findings;
}

function publicClientFindings(client: AccessClientDetails): ClientFinding[] {
  const findings: ClientFinding[] = [];
  if (client.flows.standardFlow === false) {
    findings.push({
      id: 'no-standard-flow',
      severity: 'problem',
      title: 'Browser sign-in (Standard flow) is off, so people cannot sign in to this app.',
      fix: "Turn on Standard flow in the client's settings.",
    });
  }
  if (client.flows.standardFlow !== false && client.redirects.redirectUris.length === 0) {
    findings.push({
      id: 'no-redirect-uris',
      severity: 'problem',
      title:
        'No Valid redirect URIs are set, so Keycloak refuses every sign-in with "Invalid parameter: redirect_uri".',
      fix: "Add your app's address, for example https://my-app.alberta.ca/*.",
    });
  }
  if (client.redirects.webOrigins.length === 0) {
    findings.push({
      id: 'no-web-origins',
      severity: 'warning',
      title: 'No Web origins are set, so browsers block token requests from your app with a CORS error.',
      fix: "Add + to allow the origins of your redirect URIs, or add your app's origin such as https://my-app.alberta.ca.",
    });
  }
  if (client.flows.standardFlow !== false && client.redirects.postLogoutRedirectUris.length === 0) {
    findings.push({
      id: 'no-post-logout-uris',
      severity: 'tip',
      title: 'No Valid post logout redirect URIs are set, so signing out cannot return people to your app.',
      fix: 'Add + to reuse your redirect URIs.',
    });
  }
  if (client.authentication.pkceMethod !== 'S256') {
    findings.push({
      id: 'no-pkce',
      severity: 'tip',
      title: 'PKCE is not required, which leaves browser sign-in less protected.',
      fix: "Set Proof Key for Code Exchange Code Challenge Method to S256, and use pkceMethod: 'S256' in keycloak-js.",
    });
  }
  return findings;
}

function confidentialClientFindings({
  client,
  serviceAccountClientRoleCount,
  secretCreatedAt,
  now = new Date(),
}: ClientSetupFacts): ClientFinding[] {
  const findings: ClientFinding[] = [];
  const { standardFlow, serviceAccounts, directAccessGrants } = client.flows;
  if (!standardFlow && !serviceAccounts && !directAccessGrants) {
    findings.push({
      id: 'no-flows',
      severity: 'warning',
      title: 'No way to get a token is turned on, so this client cannot get tokens.',
      fix: 'Turn on Service account roles for a backend service, or Standard flow for a server-side web app.',
    });
  }
  if (serviceAccounts && serviceAccountClientRoleCount === 0) {
    findings.push({
      id: 'service-account-no-roles',
      severity: 'warning',
      title: 'The service account has no service roles, so ADSP services will refuse its calls with 403 Forbidden.',
      fix: "Assign the roles it needs under the client's Service account roles tab, for example urn:ads:platform:configuration-service configured-service.",
    });
  }
  if (secretCreatedAt && now.getTime() - secretCreatedAt.getTime() > SECRET_AGE_TIP_DAYS * DAY_MS) {
    findings.push({
      id: 'old-secret',
      severity: 'tip',
      title: `The client secret was created on ${secretCreatedAt.toISOString().slice(0, 10)}, over a year ago.`,
      fix: 'Plan a rotation: regenerate it on the Credentials tab and update every app that uses it at the same time.',
    });
  }
  return findings;
}

function commonFindings(client: AccessClientDetails): ClientFinding[] {
  const findings: ClientFinding[] = [];
  if (client.enabled === false) {
    findings.push({
      id: 'disabled',
      severity: 'problem',
      title: 'The client is turned off, so nobody can sign in through it and it cannot get tokens.',
      fix: "Turn on Enabled in the client's settings.",
    });
  }
  if (client.redirects.webOrigins.includes('*')) {
    findings.push({
      id: 'wildcard-web-origin',
      severity: 'warning',
      title: 'Web origins allows any website (*) to call Keycloak for this client.',
      fix: "Use + or list your app's origins instead.",
    });
  }
  if (client.flows.implicitFlow) {
    findings.push({
      id: 'implicit-flow',
      severity: 'warning',
      title: 'Implicit flow is on. It is outdated and less secure than Standard flow.',
      fix: 'Turn off Implicit flow and use Standard flow.',
    });
  }
  if (client.flows.directAccessGrants) {
    findings.push({
      id: 'direct-access-grants',
      severity: 'warning',
      title: 'Direct access grants is on, so an app can sign people in by collecting their password itself.',
      fix: 'Turn it off unless the ADSP team asked for it; apps should use the Keycloak sign-in page.',
    });
  }
  return findings;
}

/**
 * Checks a client's setup against ADSP guidance, worst first. Keycloak's built-in clients are not checked.
 */
export function checkClientSetup(facts: ClientSetupFacts): ClientFinding[] {
  const { client, environmentId } = facts;
  if (client.builtIn) {
    return [];
  }

  const findings = [
    ...commonFindings(client),
    ...redirectFindings(client, environmentId),
    ...(client.type === 'public' ? publicClientFindings(client) : []),
    ...(client.type === 'confidential' ? confidentialClientFindings(facts) : []),
  ];
  return findings.sort((left, right) => SEVERITY_ORDER[left.severity] - SEVERITY_ORDER[right.severity]);
}

export const clientUrlCheckSchema = z.object({
  url: z.string(),
  origin: z.string(),
  redirect: z.object({ allowed: z.boolean(), matchedBy: z.string().optional() }),
  webOrigin: z.object({ allowed: z.boolean(), matchedBy: z.string().optional() }),
  postLogout: z.object({ allowed: z.boolean(), matchedBy: z.string().optional() }),
  suggestions: z.object({
    redirectUri: z.string().optional(),
    webOrigin: z.string().optional(),
    postLogoutRedirectUri: z.string().optional(),
  }),
});

export type ClientUrlCheck = z.infer<typeof clientUrlCheckSchema>;

/**
 * Completes relative redirect URI patterns with the client's root URL, as Keycloak does; without a root URL they
 * match nothing.
 */
function resolvePatterns(patterns: string[], rootUrl?: string): Array<{ pattern: string; resolved: string }> {
  return patterns.flatMap((pattern) => {
    if (!pattern.startsWith('/')) {
      return [{ pattern, resolved: pattern }];
    }
    return rootUrl ? [{ pattern, resolved: `${rootUrl.replace(/\/$/, '')}${pattern}` }] : [];
  });
}

function matchesPattern(resolved: string, url: string): boolean {
  if (!resolved.endsWith('*') || resolved.includes('?')) {
    return resolved === url;
  }

  // With a wildcard, Keycloak ignores the query and fragment, and a pattern ending in /* also matches without the /.
  const withoutQuery = url.split(/[?#]/)[0];
  const prefix = resolved.slice(0, -1);
  return withoutQuery.startsWith(prefix) || (prefix.endsWith('/') && withoutQuery === prefix.slice(0, -1));
}

/**
 * Keycloak lets http://localhost and http://127.0.0.1 return addresses use any port when the pattern has none.
 */
function withoutLoopbackPort(url: string): string | undefined {
  const parsed = new URL(url);
  if (parsed.protocol !== 'http:' || !LOOPBACK_HOSTS.has(parsed.hostname) || !parsed.port) {
    return undefined;
  }
  return url.replace(`${parsed.hostname}:${parsed.port}`, parsed.hostname);
}

export function matchRedirectUri(patterns: string[], url: string, rootUrl?: string): string | undefined {
  const resolved = resolvePatterns(patterns, rootUrl);
  const portless = withoutLoopbackPort(url);
  return (
    resolved.find(({ resolved: candidate }) => matchesPattern(candidate, url)) ??
    (portless ? resolved.find(({ resolved: candidate }) => matchesPattern(candidate, portless)) : undefined)
  )?.pattern;
}

function originOfPattern(resolved: string): string | undefined {
  try {
    const parsed = new URL(resolved.replace(/\*$/, ''));
    return parsed.host ? parsed.origin : undefined;
  } catch {
    return undefined;
  }
}

export function matchWebOrigin(
  webOrigins: string[],
  redirectUris: string[],
  origin: string,
  rootUrl?: string,
): string | undefined {
  for (const entry of webOrigins) {
    if (entry === '*') {
      return entry;
    }
    if (entry === '+') {
      const derived = resolvePatterns(redirectUris, rootUrl).map(({ resolved }) => originOfPattern(resolved));
      if (derived.includes(origin)) {
        return entry;
      }
      continue;
    }
    if (entry.replace(/\/$/, '') === origin) {
      return entry;
    }
  }
  return undefined;
}

/**
 * Checks whether the URL is allowed as the client's sign-in return address, browser origin and sign-out return
 * address, and suggests the entry to add for each that is not.
 */
export function checkClientUrl(client: AccessClientDetails, url: URL): ClientUrlCheck {
  const href = url.href;
  const { redirectUris, webOrigins, postLogoutRedirectUris } = client.redirects;
  const root = client.urls.root;

  const redirect = matchRedirectUri(redirectUris, href, root);
  const webOrigin = matchWebOrigin(webOrigins, redirectUris, url.origin, root);
  const postLogoutPatterns = postLogoutRedirectUris.flatMap((entry) => (entry === '+' ? redirectUris : [entry]));
  const postLogout = matchRedirectUri(postLogoutPatterns, href, root);

  return {
    url: href,
    origin: url.origin,
    redirect: { allowed: !!redirect, ...(redirect ? { matchedBy: redirect } : {}) },
    webOrigin: { allowed: !!webOrigin, ...(webOrigin ? { matchedBy: webOrigin } : {}) },
    postLogout: { allowed: !!postLogout, ...(postLogout ? { matchedBy: postLogout } : {}) },
    suggestions: {
      ...(redirect ? {} : { redirectUri: `${url.origin}/*` }),
      ...(webOrigin ? {} : { webOrigin: url.origin }),
      ...(postLogout ? {} : { postLogoutRedirectUri: redirect ? '+' : `${url.origin}/*` }),
    },
  };
}
