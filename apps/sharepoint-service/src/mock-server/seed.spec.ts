import {
  DEMO_CLIENT_ID,
  DEMO_DETAIL_LIST_ID,
  DEMO_LIST_ID,
  DEMO_SITE_ID,
  EXPIRED_CLIENT_ID,
  UNGRANTED_SITE_ID,
  defaultSeed,
} from './seed';

describe('defaultSeed', () => {
  const site = (siteId: string) => defaultSeed.sites.find((candidate) => candidate.siteId === siteId);

  it('grants sites only to registered apps', () => {
    const clientIds = defaultSeed.apps.map(({ clientId }) => clientId);

    for (const { grants } of defaultSeed.sites) {
      expect(clientIds).toEqual(expect.arrayContaining(grants.map(({ clientId }) => clientId)));
    }
  });

  it('gives every list a unique ID', () => {
    const listIds = defaultSeed.sites.flatMap(({ lists }) => lists.map(({ listId }) => listId));

    expect(new Set(listIds).size).toBe(listIds.length);
  });

  it('lets the demo app set up lists on the demo site, and keeps the other site ungranted', () => {
    expect(site(DEMO_SITE_ID).grants).toContainEqual({ clientId: DEMO_CLIENT_ID, role: 'fullcontrol' });
    expect(site(DEMO_SITE_ID).grants).toContainEqual({ clientId: EXPIRED_CLIENT_ID, role: 'write' });
    expect(site(UNGRANTED_SITE_ID).grants).toEqual([]);
  });

  it('has the indexed key column on the intake list and the indexed parent column on the detail list', () => {
    const columns = (listId: string) => site(DEMO_SITE_ID).lists.find((list) => list.listId === listId).columns;

    expect(columns(DEMO_LIST_ID)).toContainEqual({ name: 'AdspItemKey', type: 'text', indexed: true });
    expect(columns(DEMO_DETAIL_LIST_ID)).toContainEqual({ name: 'ParentItemId', type: 'text', indexed: true });
  });
});
