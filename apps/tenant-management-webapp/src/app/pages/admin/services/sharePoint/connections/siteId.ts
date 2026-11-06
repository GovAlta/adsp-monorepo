import { Validator } from '@lib/validation/checkInput';

export interface SiteIdParts {
  host: string;
  siteCollectionId: string;
  webId: string;
}

const GUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function splitSiteId(siteId: string): SiteIdParts {
  const [host = '', siteCollectionId = '', webId = ''] = (siteId || '').split(',').map((part) => part.trim());
  return { host, siteCollectionId, webId };
}

export const siteIdCheck: Validator = (input: string) => {
  if (!input) {
    return '';
  }
  const parts = input.split(',').map((part) => part.trim());
  if (parts.length !== 3 || parts.some((part) => !part)) {
    return 'Enter the full site ID: host name, site collection ID and site ID separated by commas.';
  }
  return GUID.test(parts[1]) && GUID.test(parts[2]) ? '' : 'The site collection ID and site ID must be GUIDs.';
};
