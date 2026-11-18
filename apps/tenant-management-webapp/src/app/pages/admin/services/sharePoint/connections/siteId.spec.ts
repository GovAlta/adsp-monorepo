import { siteIdCheck, splitSiteId } from './siteId';

const VALID = 'contoso.sharepoint.com,5a58bb09-1fba-41c1-8125-69da264370a0,9f2ec1da-0be4-4a74-9254-973f0add78fd';

describe('splitSiteId', () => {
  it('splits a Graph site ID into its parts', () => {
    expect(splitSiteId(VALID)).toEqual({
      host: 'contoso.sharepoint.com',
      siteCollectionId: '5a58bb09-1fba-41c1-8125-69da264370a0',
      webId: '9f2ec1da-0be4-4a74-9254-973f0add78fd',
    });
  });

  it('ignores spaces around the parts', () => {
    expect(splitSiteId(` ${VALID.replace(/,/g, ' , ')} `).host).toBe('contoso.sharepoint.com');
  });
});

describe('siteIdCheck', () => {
  it('accepts a full Graph site ID', () => {
    expect(siteIdCheck(VALID)).toBe('');
  });

  it('rejects a value without all three parts', () => {
    expect(siteIdCheck('contoso.sharepoint.com')).toMatch(/host name, site collection ID and site ID/);
    expect(siteIdCheck('contoso.sharepoint.com,,')).toMatch(/host name, site collection ID and site ID/);
  });

  it('rejects IDs that are not GUIDs', () => {
    expect(siteIdCheck('contoso.sharepoint.com,abc,def')).toMatch(/GUIDs/);
  });

  it('leaves an empty value to the required check', () => {
    expect(siteIdCheck('')).toBe('');
  });
});
