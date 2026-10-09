// Parsing and matching of the allowed upstream domains. This is deliberately free of dependencies on other modules
// so that it can be used when loading the environment.

const LABEL = '[a-z0-9_]([a-z0-9_-]*[a-z0-9_])?';
const ENTRY_PATTERN = new RegExp(`^(\\*\\.)?${LABEL}(\\.${LABEL})*(:[0-9]{1,5})?$`);

const DEFAULT_PORTS = { 'http:': '80', 'https:': '443' };

function splitPort(entry: string): [string, string] {
  const index = entry.lastIndexOf(':');
  return index < 0 ? [entry, ''] : [entry.substring(0, index), entry.substring(index + 1)];
}

function normalize(entry: string): string | null {
  const value = entry.trim().toLowerCase().replace(/\.(?=:|$)/, '');
  const [host, port] = splitPort(value);
  // A separator must be followed by a port.
  if (!ENTRY_PATTERN.test(value) || (value.includes(':') && !port)) {
    return null;
  }
  if (port && (Number(port) < 1 || Number(port) > 65535)) {
    return null;
  }

  const suffix = port ? `:${port}` : '';
  if (host.startsWith('*.')) {
    // A wildcard must be for a domain, and not for everything under a top level domain.
    return host.substring(2).includes('.') ? `${host}${suffix}` : null;
  }

  // Use the same normalization as the URLs that are checked, e.g. for IPv4 forms such as '127.1'.
  try {
    return `${new URL(`http://${host}`).hostname}${suffix}`;
  } catch {
    return null;
  }
}

/**
 * Parses a comma separated list of allowed upstream domains.
 *
 * Each entry is a host name that must match exactly (e.g. 'form-service' or 'api.example.ca'), or a wildcard that
 * matches the subdomains of a domain (e.g. '*.example.ca'; this does not match 'example.ca' itself). An entry can
 * include a port (e.g. 'form-service:3333'), and matches any port if it does not. IPv4 addresses can be listed.
 *
 * The error does not include the values that are invalid, which are reported by position instead.
 */
export function parseAllowedDomains(value: string): string[] {
  const entries = value.split(',');
  const domains: string[] = [];
  const invalid: number[] = [];
  entries.forEach((entry, index) => {
    if (entry.trim()) {
      const domain = normalize(entry);
      if (domain) {
        domains.push(domain);
      } else {
        invalid.push(index + 1);
      }
    }
  });

  if (invalid.length > 0) {
    throw new Error(
      `contains invalid entries at position ${invalid.join(', ')} (use host names like 'api.example.ca' or ` +
        `'*.example.ca', optionally with a port)`
    );
  }
  if (domains.length < 1 && value.trim()) {
    throw new Error('contains no domains');
  }

  return Array.from(new Set(domains));
}

/**
 * Checks that the upstream is an http(s) URL without credentials, and that its host (and port, if the allowed
 * domain includes one) matches an allowed domain.
 */
export function isAllowedUpstream(url: URL, allowedDomains: string[]): boolean {
  if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password) {
    return false;
  }

  const hostname = url.hostname.toLowerCase().replace(/\.$/, '');
  const port = url.port || DEFAULT_PORTS[url.protocol];
  return allowedDomains.some((entry) => {
    const [domain, allowedPort] = splitPort(entry);
    return (
      (!allowedPort || allowedPort === port) &&
      (domain.startsWith('*.') ? hostname.endsWith(domain.substring(1)) : hostname === domain)
    );
  });
}
