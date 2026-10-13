import { isAllowedUpstream, parseAllowedDomains } from './upstream-domains';

describe('upstream domains', () => {
  describe('parseAllowedDomains', () => {
    it('can parse domains', () => {
      expect(parseAllowedDomains('form-service, *.Example.CA ,api.example.ca.,10.1.2.3,my_service')).toEqual([
        'form-service',
        '*.example.ca',
        'api.example.ca',
        '10.1.2.3',
        'my_service',
      ]);
    });

    it('can parse domains with ports', () => {
      expect(parseAllowedDomains('form-service:3333,*.apps.example.ca:8443,api.example.ca.:443')).toEqual([
        'form-service:3333',
        '*.apps.example.ca:8443',
        'api.example.ca:443',
      ]);
    });

    it('can normalize IPv4 addresses', () => {
      expect(parseAllowedDomains('127.1,10.1.2.3:8080')).toEqual(['127.0.0.1', '10.1.2.3:8080']);
    });

    it('can parse empty value', () => {
      expect(parseAllowedDomains('')).toEqual([]);
      expect(parseAllowedDomains('   ')).toEqual([]);
    });

    it('can remove duplicates', () => {
      expect(parseAllowedDomains('a.example.ca,A.example.ca,a.example.ca.')).toEqual(['a.example.ca']);
    });

    it.each(['a,', ',a', 'a,,b'])('can ignore empty entries in %s', (value) => {
      expect(parseAllowedDomains(value).length).toBeGreaterThan(0);
    });

    it.each([',', ' , , '])('can reject value with no domains: %s', (value) => {
      expect(() => parseAllowedDomains(value)).toThrow('contains no domains');
    });

    it.each([
      'https://api.example.ca',
      'api.example.ca/path',
      'user@api.example.ca',
      'user:pass@api.example.ca',
      'api example.ca',
      '*',
      '*.',
      '*.ca',
      '**.example.ca',
      'api.*.example.ca',
      'api*.example.ca',
      '-api.example.ca',
      'api-.example.ca',
      'api..example.ca',
      'api.example.ca:',
      'api.example.ca:0',
      'api.example.ca:65536',
      'api.example.ca:http',
      'api.example.ca:80:90',
      '[::1]',
      '::1',
    ])('can reject %s', (value) => {
      expect(() => parseAllowedDomains(value)).toThrow('invalid entries');
    });

    it('can report the position of invalid entries without the values', () => {
      let message: string;
      try {
        parseAllowedDomains('api.example.ca,https://user:secret@a.ca,,*.ca');
      } catch (err) {
        message = err.message;
      }

      expect(message).toContain('position 2, 4');
      expect(message).not.toContain('secret');
      expect(message).not.toContain('https');
    });
  });

  describe('isAllowedUpstream', () => {
    const domains = parseAllowedDomains(
      'form-service,api.example.ca:8443,*.apps.example.ca,*.secure.example.ca:443,10.1.2.3,my_service'
    );

    it.each([
      'http://form-service:3333/form/v1',
      'http://form-service/',
      'https://api.example.ca:8443',
      'https://API.example.ca:8443/path?x=1',
      // The port is restricted, not the scheme.
      'http://api.example.ca:8443/path',
      'https://api.example.ca.:8443/path',
      'https://app.apps.example.ca',
      'https://a.b.apps.example.ca:9000',
      'https://app.secure.example.ca',
      'https://app.secure.example.ca:443',
      'http://10.1.2.3:8080',
      'http://my_service:3000',
    ])('can allow %s', (value) => {
      expect(isAllowedUpstream(new URL(value), domains)).toBe(true);
    });

    it.each([
      // Not listed.
      'https://other.example.ca',
      'https://example.ca',
      'http://localhost:3333',
      'http://169.254.169.254/metadata',
      'http://10.1.2.4',
      'http://127.0.0.1',
      'http://[::1]:3333',
      // A listed port restricts the port, using the default port for the scheme if there is none.
      'https://api.example.ca',
      'https://api.example.ca:9229',
      'http://app.secure.example.ca',
      'https://app.secure.example.ca:8443',
      // Wildcards match subdomains, not the domain itself or look-alikes.
      'https://apps.example.ca',
      'https://evilapps.example.ca',
      'https://apps.example.ca.evil.com',
      'https://api.example.ca.evil.com:8443',
      'https://evil-api.example.ca:8443',
      // The host is the part after any credentials, and a path or query does not count.
      'https://api.example.ca@evil.com',
      'https://evil.com/api.example.ca',
      'https://evil.com/?api.example.ca',
      'https://evil.com#api.example.ca',
      // Credentials in the URL are not accepted.
      'https://user:pass@app.apps.example.ca',
      'https://user@app.apps.example.ca',
      // Only http(s).
      'ftp://app.apps.example.ca',
      'file://app.apps.example.ca/etc/passwd',
      'ws://app.apps.example.ca',
    ])('can reject %s', (value) => {
      expect(isAllowedUpstream(new URL(value), domains)).toBe(false);
    });

    describe('with wildcards for two domains', () => {
      const wildcards = parseAllowedDomains('*.agency.example.ca,*.example.org');

      it.each([
        'https://www.example.org',
        'https://app.example.org/api/v1',
        'https://a.b.example.org:8443',
        'https://api.agency.example.ca/api',
        'https://svc.apps.agency.example.ca',
        'http://svc.agency.example.ca',
      ])('can allow %s', (value) => {
        expect(isAllowedUpstream(new URL(value), wildcards)).toBe(true);
      });

      it.each([
        // The wildcards are for subdomains, so the domains themselves are listed separately.
        'https://example.org',
        'https://agency.example.ca',
        'https://example.ca',
        // Look-alikes and other hosts.
        'https://notexample.org',
        'https://example.org.evil.com',
        'https://www.example.com',
        'https://agency.example.ca.evil.com',
        'https://www.agency.example.ca@evil.com',
        'https://evil.com/www.example.org',
        // Internal names and addresses are not under these domains.
        'http://form-service:3333',
        'http://configuration-service.adsp.svc.cluster.local',
        'http://localhost:3333',
        'http://169.254.169.254/metadata',
      ])('can reject %s', (value) => {
        expect(isAllowedUpstream(new URL(value), wildcards)).toBe(false);
      });
    });

    it('can allow any port for a host listed without a port', () => {
      expect(isAllowedUpstream(new URL('http://form-service:9229'), domains)).toBe(true);
    });

    it('can match IPv4 addresses that are listed in a shortened form', () => {
      expect(isAllowedUpstream(new URL('http://127.0.0.1:3000'), parseAllowedDomains('127.1'))).toBe(true);
    });

    it('can reject everything for no domains', () => {
      expect(isAllowedUpstream(new URL('https://api.example.ca'), [])).toBe(false);
    });
  });
});
