import { createNginxConfig } from './proxyConfig';

describe('createNginxConfig', () => {
  const options = {
    base: 'https://token-handler.example.ca/token-handler/v1',
    clientId: 'my-client',
    tenantName: 'My Tenant',
    targetIds: ['form-api'],
  };

  // The directives of the location, without the comments.
  const locationStart = (config: string) => config.indexOf('\nlocation /') + 1;
  const directives = (config: string) => config.substring(locationStart(config)).split('\n');

  it('can proxy the token handler path with one location', () => {
    const config = createNginxConfig(options);

    expect(config.match(/^location /gm)).toHaveLength(1);
    expect(directives(config)).toEqual([
      'location /token-handler/ {',
      '  proxy_pass https://token-handler.example.ca/token-handler/v1/;',
      '  proxy_ssl_server_name on;',
      '',
      '  proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;',
      '  proxy_set_header X-Forwarded-Proto $http_x_forwarded_proto;',
      '}',
    ]);
  });

  it('does not set the tenant in the location', () => {
    expect(directives(createNginxConfig(options)).join('\n')).not.toContain('X-Adsp-Tenant');
  });

  it('can provide the tenant name when signing in', () => {
    expect(createNginxConfig(options)).toContain('/auth?tenant=My%20Tenant&callbackUrl=<callback URL>');
  });

  it('can encode the tenant name when signing in', () => {
    const config = createNginxConfig({ ...options, tenantName: 'My_Tenant 2' });

    expect(config).toContain('/auth?tenant=My_Tenant%202&callbackUrl=');
  });

  it('can show a placeholder for the tenant name as it is', () => {
    const config = createNginxConfig({ ...options, tenantName: '<tenant name>' });

    expect(config).toContain('/auth?tenant=<tenant name>&callbackUrl=<callback URL>');
    expect(config).toContain('proxy_set_header X-Adsp-Tenant "<tenant name>";');
  });

  it('can describe how to restrict the site to the tenant with the header', () => {
    const config = createNginxConfig(options);

    expect(config).toContain('To restrict this site to the tenant');
    expect(config).toContain('#   proxy_set_header X-Adsp-Tenant "My Tenant";');
  });

  it('does not set the host', () => {
    expect(createNginxConfig(options)).not.toContain('Host');
  });

  it('can omit the server name directive when the token handler is not addressed over TLS', () => {
    const config = createNginxConfig({ ...options, base: 'http://token-handler:3333/token-handler/v1' });

    expect(config).toContain('proxy_pass http://token-handler:3333/token-handler/v1/;');
    expect(config).not.toContain('proxy_ssl_server_name');
  });

  it('can describe the paths of the client', () => {
    const config = createNginxConfig(options);

    expect(config).toContain('/token-handler/clients/my-client/auth?tenant=My%20Tenant&callbackUrl=<callback URL>');
    expect(config).toContain('/token-handler/clients/my-client/callback');
    expect(config).toContain('/token-handler/clients/my-client/logout');
    expect(config).toContain('/token-handler/sessions');
  });

  it('can describe the paths of each target', () => {
    const config = createNginxConfig({ ...options, targetIds: ['form-api', 'file-api'] });

    expect(config).toMatch(/Target form-api: +\/token-handler\/targets\/form-api\/\.\.\./);
    expect(config).toMatch(/Target file-api: +\/token-handler\/targets\/file-api\/\.\.\./);
  });

  it('can note when there are no targets', () => {
    const config = createNginxConfig({ ...options, targetIds: [] });

    expect(config).toContain('No targets are configured');
    expect(config).not.toContain('/targets/');
  });

  it('can explain the callback URL requirement', () => {
    const config = createNginxConfig(options);

    expect(config).toContain('The callback URL must be this path');
    expect(config).toContain('valid redirect URI of the client in Keycloak');
  });

  it('can note that $scheme is used when nginx terminates TLS', () => {
    expect(createNginxConfig(options)).toContain('Use $scheme for X-Forwarded-Proto');
  });

  it('can create comments only before the location', () => {
    const config = createNginxConfig(options);
    const start = locationStart(config);

    expect(config.substring(0, start).split('\n').filter(Boolean).every((line) => line.startsWith('#'))).toBe(true);
    expect(config.substring(start)).not.toContain('#');
  });

  it('can line up the paths', () => {
    const config = createNginxConfig({ ...options, targetIds: ['form-api', 'file-service-api'] });

    const columns = config
      .split('\n')
      .filter((line) => line.startsWith('#   ') && /\s\/token-handler\//.test(line))
      .map((line) => line.indexOf('/token-handler/'));

    // Sign in, callback, sign out, session information and the two targets.
    expect(columns).toHaveLength(6);
    expect(new Set(columns).size).toBe(1);
  });

  it('can line up the callback note with the paths', () => {
    const lines = createNginxConfig(options).split('\n');

    const callback = lines.find((line) => line.includes('/callback'));
    const note = lines.find((line) => line.includes('The callback URL must be this path'));
    expect(note.indexOf('The callback')).toBe(callback.indexOf('/token-handler/'));
  });

  it('can separate the sections with blank lines', () => {
    const config = createNginxConfig(options);

    // Blank comment lines between the description, the paths and the notes.
    expect(config).toContain('application\'s site.\n#\n# The application uses these paths:');
    expect(config).toContain('/token-handler/targets/form-api/...\n#\n# Use $scheme');
    expect(config).toContain('Use $scheme for X-Forwarded-Proto if nginx terminates TLS itself.\n#\n# To restrict');
    // Blank line between the proxy target and the headers.
    expect(config).toContain('proxy_ssl_server_name on;\n\n  proxy_set_header X-Forwarded-For');
  });

  it('does not leave trailing spaces', () => {
    const config = createNginxConfig({ ...options, targetIds: ['a', 'b'] });

    expect(config.split('\n').filter((line) => /\s$/.test(line))).toEqual([]);
  });

  it('does not describe what the application sends, which is not proxy configuration', () => {
    // The CSRF header is set by the application and is passed through by the proxy like any other header.
    expect(createNginxConfig(options)).not.toContain('XSRF');
    expect(createNginxConfig({ ...options, targetIds: [] })).not.toContain('XSRF');
  });
});
