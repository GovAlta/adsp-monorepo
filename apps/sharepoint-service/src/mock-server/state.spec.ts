import { DEMO_CLIENT_ID, DEMO_LIST_ID, DEMO_SITE_ID, defaultSeed } from './seed';
import { MockState } from './state';

describe('MockState', () => {
  let state: MockState;

  beforeEach(() => {
    state = new MockState(defaultSeed);
  });

  it('works on its own copy of the seed', () => {
    state.createList(state.findSite(DEMO_SITE_ID), 'Pets');

    expect(new MockState(defaultSeed).findSite(DEMO_SITE_ID).lists.map(({ displayName }) => displayName)).not.toContain(
      'Pets',
    );
    expect(defaultSeed.sites[0].lists.map(({ displayName }) => displayName)).not.toContain('Pets');
  });

  it('creates a list whose Title column is required, as SharePoint does', () => {
    const list = state.createList(state.findSite(DEMO_SITE_ID), 'Pets');

    expect(list.columns).toEqual([{ name: 'Title', displayName: 'Title', type: 'text', required: true }]);
    expect(state.findSite(DEMO_SITE_ID).lists).toContain(list);
  });

  it('adds a column to a list', () => {
    const list = state.createList(state.findSite(DEMO_SITE_ID), 'Pets');
    state.addColumn(list, { name: 'PetName', type: 'text' });

    expect(list.columns.map(({ name }) => name)).toEqual(['Title', 'PetName']);
  });

  it('creates, updates and deletes items', () => {
    const item = state.createItem(DEMO_LIST_ID, { FirstName: 'Ada' });
    state.updateItem(DEMO_LIST_ID, item.id, { Amount: 5 });

    expect(state.listItems(DEMO_LIST_ID)[0].fields).toEqual({ FirstName: 'Ada', Amount: 5 });
    expect(state.updateItem(DEMO_LIST_ID, 'missing', {})).toBeNull();
    expect(state.deleteItem(DEMO_LIST_ID, item.id)).toBe(true);
    expect(state.deleteItem(DEMO_LIST_ID, item.id)).toBe(false);
    expect(state.listItems(DEMO_LIST_ID)).toEqual([]);
  });

  it('uses up a fault one request at a time', () => {
    state.setFault('throttle', 2);

    expect([state.takeFault(), state.takeFault(), state.takeFault()]).toEqual(['throttle', 'throttle', null]);
  });

  it('accepts a token until it expires', () => {
    const now = Date.now();
    const clock = jest.spyOn(Date, 'now').mockReturnValue(now);
    try {
      const token = state.issueToken(DEMO_CLIENT_ID);
      expect(state.clientForToken(token)).toBe(DEMO_CLIENT_ID);

      clock.mockReturnValue(now + 3600 * 1000);
      expect(state.clientForToken(token)).toBeNull();
      expect(state.clientForToken('unknown')).toBeNull();
    } finally {
      clock.mockRestore();
    }
  });

  it('goes back to the seed, with no items, tokens or faults, when reset', () => {
    state.createList(state.findSite(DEMO_SITE_ID), 'Pets');
    state.createItem(DEMO_LIST_ID, { FirstName: 'Ada' });
    const token = state.issueToken(DEMO_CLIENT_ID);
    state.setFault('unavailable', 1);

    state.reset();

    expect(state.findSite(DEMO_SITE_ID).lists.map(({ displayName }) => displayName)).not.toContain('Pets');
    expect(state.listItems(DEMO_LIST_ID)).toEqual([]);
    expect(state.clientForToken(token)).toBeNull();
    expect(state.takeFault()).toBeNull();
    expect(state.createItem(DEMO_LIST_ID, {}).id).toBe('1');
  });
});
