interface NginxConfigOptions {
  // Base URL of the token handler API, e.g. https://token-handler.example.ca/token-handler/v1
  base: string;
  clientId: string;
  // Name of the tenant, which the application provides when it signs in. This is the same in every environment.
  tenantName: string;
  targetIds: string[];
}

// The path of the application that is proxied to the token handler; the application's other paths are not affected.
const PROXY_PATH = '/token-handler';

const comment = (lines: string[]) => lines.map((line) => (line ? `# ${line}` : '#'));

/**
 * Creates the nginx configuration that proxies the requests of an application, from its own domain, to the token
 * handler.
 *
 * All routes of the token handler are under the same path, so one location is enough for the client, its sign in
 * and callback, the session information and the targets. The comments describe the paths that the application uses.
 */
export const createNginxConfig = ({ base, clientId, tenantName, targetIds }: NginxConfigOptions): string => {
  const clientPath = `${PROXY_PATH}/clients/${clientId}`;

  // The placeholder is not encoded, so that it reads as one.
  const tenantParameter = tenantName.startsWith('<') ? tenantName : encodeURIComponent(tenantName);

  // The paths are lined up so that they are easy to scan.
  const paths: [string, string][] = [
    ['Sign in:', `${clientPath}/auth?tenant=${tenantParameter}&callbackUrl=<callback URL>`],
    ['Sign in callback:', `${clientPath}/callback`],
    ['Sign out:', `${clientPath}/logout`],
    ['Session information:', `${PROXY_PATH}/sessions`],
    ...targetIds.map((targetId): [string, string] => [`Target ${targetId}:`, `${PROXY_PATH}/targets/${targetId}/...`]),
  ];
  const labelWidth = Math.max(...paths.map(([label]) => label.length));
  const pathLines = paths.flatMap(([label, path]) => [
    `  ${label.padEnd(labelWidth)} ${path}`,
    ...(label === 'Sign in callback:'
      ? [`  ${''.padEnd(labelWidth)} The callback URL must be this path, and a valid redirect URI of the client in Keycloak.`]
      : []),
  ]);

  return [
    ...comment([
      `Token handler proxy for the client ${clientId}. Add this location to the server block of the application.`,
      `Requests to ${PROXY_PATH}/... are proxied to the token handler, so that the session cookie is set for the`,
      "application's site.",
      '',
      'The application uses these paths:',
      ...pathLines,
      ...(targetIds.length > 0
        ? []
        : ['', 'No targets are configured. Add a target to proxy requests to an upstream service.']),
      '',
      'Use $scheme for X-Forwarded-Proto if nginx terminates TLS itself.',
      '',
      'To restrict this site to the tenant, also add the header that sets it, so that it cannot be changed:',
      `  proxy_set_header X-Adsp-Tenant "${tenantName}";`,
    ]),
    `location ${PROXY_PATH}/ {`,
    `  proxy_pass ${base}/;`,
    // The name of the token handler needs to be sent when connecting over TLS.
    ...(base.startsWith('https://') ? ['  proxy_ssl_server_name on;'] : []),
    '',
    '  proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;',
    '  proxy_set_header X-Forwarded-Proto $http_x_forwarded_proto;',
    '}',
  ].join('\n');
};
