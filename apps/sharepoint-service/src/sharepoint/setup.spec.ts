import { adspId } from '@abgov/adsp-service-sdk';
import { SharePointError } from './errors';
import { GraphClient, GraphTokenProvider, ListColumn, NewColumn } from './graph';
import { ListNameTakenError, SharePointSetup } from './setup';
import { SharePointConfiguration, SharePointDestination } from './types';

const tenantId = adspId`urn:ads:platform:tenant-service:v2:/tenants/test`;
const siteId = 'contoso.sharepoint.com,site,web';

const text = (name: string, extra: Partial<ListColumn> = {}): ListColumn => ({
  id: `id-${name}`,
  name,
  displayName: name,
  indexed: false,
  required: false,
  type: 'text',
  ...extra,
});

class FakeGraph {
  lists = new Map<string, { name: string; columns: ListColumn[] }>();
  private nextList = 1;

  getListColumns = jest.fn(async (_token: string, _site: string, listId: string) => {
    const list = this.lists.get(listId);
    if (!list) {
      throw new SharePointError('graph:itemNotFound', false);
    }
    return list.columns.map((column) => ({ ...column }));
  });

  findListIdByName = jest.fn(
    async (_token: string, _site: string, name: string) =>
      [...this.lists.entries()].find(([, list]) => list.name === name)?.[0] ?? null,
  );

  createList = jest.fn(async (_token: string, _site: string, name: string) => {
    const listId = `new-list-${this.nextList++}`;
    this.lists.set(listId, { name, columns: [text('Title', { required: true })] });
    return listId;
  });

  createColumn = jest.fn(async (_token: string, _site: string, listId: string, column: NewColumn) => {
    this.lists.get(listId).columns.push({
      id: `id-${column.name}`,
      name: column.name,
      displayName: column.displayName,
      indexed: column.indexed,
      required: false,
      type: column.type,
    });
  });

  updateColumn = jest.fn(
    async (_token: string, _site: string, listId: string, columnId: string, changes: Partial<ListColumn>) => {
      Object.assign(
        this.lists.get(listId).columns.find(({ id }) => id === columnId),
        changes,
      );
    },
  );
}

describe('SharePointSetup', () => {
  const main: SharePointDestination = {
    id: 'household',
    name: 'Household',
    connectionId: 'hr-site',
    listId: 'main-list',
    fieldMappings: [
      { source: 'applicant.firstName', target: 'FirstName', columnType: 'text', displayName: 'First name' },
      { source: 'contactMethods', target: 'ContactMethods', columnType: 'multiChoice', choices: ['Email', 'Phone'] },
      { source: 'income', target: 'Income', columnType: 'number' },
      { source: 'other', target: 'Untyped' },
    ],
    idempotencyFields: ['_adsp.key'],
    folderLinkField: 'FilesFolder',
    detailLists: [
      {
        listId: 'members-list',
        dataPath: 'householdMembers',
        parentRefField: 'ParentItemId',
        fieldMappings: [{ source: 'name', target: 'MemberName', columnType: 'text' }],
      },
    ],
  };
  const configurationFor = (destination: SharePointDestination): SharePointConfiguration => ({
    connections: { 'hr-site': { id: 'hr-site', name: 'HR', entraTenantId: 't', clientId: 'c', siteId } },
    destinations: { [destination.id]: destination },
  });
  const readyMainColumns = () => [
    text('Title', { required: true }),
    text('AdspItemKey', { indexed: true }),
    text('FirstName'),
    { ...text('ContactMethods'), type: 'multiChoice' as const },
    { ...text('Income'), type: 'number' as const },
    { ...text('Untyped'), type: 'hyperlink' as const },
    { ...text('FilesFolder'), type: 'hyperlink' as const },
  ];

  let graph: FakeGraph;
  let tokens: { getToken: jest.Mock; evict: jest.Mock };
  let setup: SharePointSetup;

  beforeEach(() => {
    graph = new FakeGraph();
    graph.lists.set('main-list', { name: 'Housing benefit', columns: readyMainColumns() });
    graph.lists.set('members-list', {
      name: 'Household members',
      columns: [text('ParentItemId', { indexed: true }), text('MemberName')],
    });
    tokens = { getToken: jest.fn().mockResolvedValue('token-1'), evict: jest.fn() };
    setup = new SharePointSetup(tokens as unknown as GraphTokenProvider, graph as unknown as GraphClient);
  });

  describe('verify', () => {
    it('reports a destination as ready when every list and column is in place', async () => {
      const result = await setup.verify(tenantId, configurationFor(main), 'household');

      expect(result.ready).toBe(true);
      expect(result.lists.map(({ kind, listId, status }) => [kind, listId, status])).toEqual([
        ['main', 'main-list', 'ok'],
        ['detail', 'members-list', 'ok'],
      ]);
      expect(result.lists[0].columns.map(({ name, purpose }) => [name, purpose])).toEqual([
        ['AdspItemKey', 'key'],
        ['FilesFolder', 'folder'],
        ['FirstName', 'mapped'],
        ['ContactMethods', 'mapped'],
        ['Income', 'mapped'],
        ['Untyped', 'mapped'],
      ]);
    });

    it('reports missing columns, an unindexed key column and a column of the wrong type', async () => {
      graph.lists.get('main-list').columns = [
        text('AdspItemKey'),
        text('ContactMethods'),
        { ...text('Income'), type: 'choice' },
      ];

      const result = await setup.verify(tenantId, configurationFor(main), 'household');
      const status = Object.fromEntries(result.lists[0].columns.map(({ name, status }) => [name, status]));

      expect(result.ready).toBe(false);
      expect(status).toEqual({
        AdspItemKey: 'notIndexed',
        FilesFolder: 'missing',
        FirstName: 'missing',
        ContactMethods: 'wrongType',
        Income: 'wrongType',
        Untyped: 'missing',
      });
      expect(result.lists[0].columns.find(({ name }) => name === 'Income')).toMatchObject({
        expectedType: 'number',
        actualType: 'choice',
      });
    });

    it('does not check the type of a mapping without a column type', async () => {
      const result = await setup.verify(tenantId, configurationFor(main), 'household');

      expect(result.lists[0].columns.find(({ name }) => name === 'Untyped')).toMatchObject({ status: 'ok' });
    });

    it('accepts a Hyperlink column that Graph lists without any type', async () => {
      graph.lists.get('main-list').columns = readyMainColumns().map((column) =>
        column.name === 'FilesFolder' ? { ...column, type: 'unknown' as const } : column,
      );

      const result = await setup.verify(tenantId, configurationFor(main), 'household');

      expect(result.lists[0].columns.find(({ name }) => name === 'FilesFolder')).toMatchObject({ status: 'ok' });
    });

    it('reports a column of another known type, such as a Lookup, where a Hyperlink is needed', async () => {
      graph.lists.get('main-list').columns = readyMainColumns().map((column) =>
        column.name === 'FilesFolder' ? { ...column, type: 'other' as const } : column,
      );

      const result = await setup.verify(tenantId, configurationFor(main), 'household');

      expect(result.lists[0].columns.find(({ name }) => name === 'FilesFolder')).toMatchObject({
        status: 'wrongType',
        actualType: 'other',
      });
    });

    it('reports a column without a type when the mapping needs a type other than Hyperlink', async () => {
      graph.lists.get('main-list').columns = readyMainColumns().map((column) =>
        column.name === 'Income' ? { ...column, type: 'unknown' as const } : column,
      );

      const result = await setup.verify(tenantId, configurationFor(main), 'household');

      expect(result.lists[0].columns.find(({ name }) => name === 'Income')).toMatchObject({ status: 'wrongType' });
    });

    it('suggests the internal name of a column whose display name matches', async () => {
      graph.lists.get('main-list').columns = readyMainColumns().map((column) =>
        column.name === 'FirstName' ? { ...column, name: 'First_x0020_Name', displayName: 'FirstName' } : column,
      );

      const result = await setup.verify(tenantId, configurationFor(main), 'household');

      expect(result.lists[0].columns.find(({ name }) => name === 'FirstName')).toMatchObject({
        status: 'missing',
        matchingName: 'First_x0020_Name',
      });
    });

    it('reports a detail list that is not created yet and a list that cannot be found', async () => {
      const notCreated = {
        ...main,
        listId: 'gone',
        detailLists: [{ ...main.detailLists[0], listId: undefined, listName: 'Household members' }],
      };

      const result = await setup.verify(tenantId, configurationFor(notCreated), 'household');

      expect(result.lists[0]).toMatchObject({ status: 'notFound', listId: 'gone' });
      expect(result.lists[1]).toMatchObject({ status: 'notCreated', listName: 'Household members' });
      expect(result.lists[1].columns.map(({ name, status }) => [name, status])).toEqual([
        ['ParentItemId', 'missing'],
        ['MemberName', 'missing'],
      ]);
    });

    it('leaves out the key column when the destination has no row identity', async () => {
      const noIdentity = { ...main, idempotencyFields: [], detailLists: [] };

      const result = await setup.verify(tenantId, configurationFor(noIdentity), 'household');

      expect(result.lists[0].columns.map(({ name }) => name)).not.toContain('AdspItemKey');
    });

    it('never treats a mapping to a key column as a data column', async () => {
      const spoof = {
        ...main,
        fieldMappings: [{ source: 'x', target: 'AdspItemKey', columnType: 'number' as const }],
        detailLists: [
          {
            ...main.detailLists[0],
            fieldMappings: [{ source: 'x', target: 'ParentItemId', columnType: 'number' as const }],
          },
        ],
      };

      const result = await setup.verify(tenantId, configurationFor(spoof), 'household');

      expect(result.lists[0].columns.filter(({ name }) => name === 'AdspItemKey')).toEqual([
        expect.objectContaining({ purpose: 'key', status: 'ok' }),
      ]);
      expect(result.lists[1].columns.filter(({ name }) => name === 'ParentItemId')).toEqual([
        expect.objectContaining({ purpose: 'parent', status: 'ok' }),
      ]);
    });

    it('fails on other SharePoint errors', async () => {
      graph.getListColumns.mockRejectedValueOnce(new SharePointError('graph:accessDenied', false));

      await expect(setup.verify(tenantId, configurationFor(main), 'household')).rejects.toMatchObject({
        errorCode: 'graph:accessDenied',
      });
    });
  });

  describe('set up', () => {
    const notCreated = {
      ...main,
      detailLists: [{ ...main.detailLists[0], listId: undefined, listName: 'Household members' }],
    };

    beforeEach(() => {
      graph.lists.delete('members-list');
      graph.lists.get('main-list').columns = [text('Title', { required: true }), text('AdspItemKey')];
    });

    it('creates the missing detail list and columns, indexes the key columns and reports the result', async () => {
      const result = await setup.setUp(tenantId, configurationFor(notCreated), 'household');

      expect(result.permissionDenied).toBe(false);
      expect(result.createdLists).toEqual([
        {
          index: 0,
          dataPath: 'householdMembers',
          listName: 'Household members',
          listId: 'new-list-1',
        },
      ]);
      expect(result.report.ready).toBe(true);
      expect(result.failures).toEqual([]);

      const created = graph.createColumn.mock.calls.map(([, , listId, column]) => [listId, column]);
      expect(created).toEqual(
        expect.arrayContaining([
          ['main-list', { name: 'FilesFolder', displayName: 'FilesFolder', type: 'hyperlink', indexed: false }],
          ['main-list', { name: 'FirstName', displayName: 'First name', type: 'text', indexed: false }],
          [
            'main-list',
            {
              name: 'ContactMethods',
              displayName: 'ContactMethods',
              type: 'multiChoice',
              indexed: false,
              choices: ['Email', 'Phone'],
            },
          ],
          ['main-list', { name: 'Untyped', displayName: 'Untyped', type: 'text', indexed: false }],
          ['new-list-1', { name: 'ParentItemId', displayName: 'ParentItemId', type: 'text', indexed: true }],
          ['new-list-1', { name: 'MemberName', displayName: 'MemberName', type: 'text', indexed: false }],
        ]),
      );
      expect(graph.lists.get('main-list').columns.find(({ name }) => name === 'AdspItemKey').indexed).toBe(true);
      expect(graph.lists.get('new-list-1').columns.find(({ name }) => name === 'Title').required).toBe(false);
      expect(result.createdColumns).toHaveLength(7);
      expect(result.indexedColumns).toEqual([{ listId: 'main-list', name: 'AdspItemKey' }]);
    });

    it('refuses a list name that is already taken, and changes nothing', async () => {
      graph.lists.set('existing-list', { name: 'Household members', columns: [text('Title')] });

      const error = await setup.setUp(tenantId, configurationFor(notCreated), 'household').catch((err) => err);

      expect(error).toBeInstanceOf(ListNameTakenError);
      expect(error.lists).toEqual([
        { index: 0, dataPath: 'householdMembers', listName: 'Household members', listId: 'existing-list' },
      ]);
      expect(graph.createList).not.toHaveBeenCalled();
      expect(graph.createColumn).not.toHaveBeenCalled();
    });

    it('adds the missing columns to an existing list entered by its ID', async () => {
      graph.lists.set('existing-list', { name: 'Household members', columns: [text('Title')] });
      const byId = { ...main, detailLists: [{ ...main.detailLists[0], listId: 'existing-list' }] };

      const result = await setup.setUp(tenantId, configurationFor(byId), 'household');

      expect(graph.createList).not.toHaveBeenCalled();
      expect(result.createdLists).toEqual([]);
      expect(graph.lists.get('existing-list').columns.map(({ name }) => name)).toEqual([
        'Title',
        'ParentItemId',
        'MemberName',
      ]);
    });

    it('stops at the first refused change and reports that the app cannot make changes', async () => {
      graph.createColumn.mockRejectedValueOnce(new SharePointError('graph:accessDenied', false));

      const result = await setup.setUp(tenantId, configurationFor({ ...main, detailLists: [] }), 'household');

      expect(result.permissionDenied).toBe(true);
      expect(graph.createColumn).toHaveBeenCalledTimes(1);
      expect(graph.updateColumn).not.toHaveBeenCalled();
      expect(result.report.ready).toBe(false);
    });

    it('reports a refused list creation the same way', async () => {
      graph.createList.mockRejectedValueOnce(new SharePointError('graph:accessDenied', false));

      const result = await setup.setUp(tenantId, configurationFor(notCreated), 'household');

      expect(result.permissionDenied).toBe(true);
      expect(result.createdLists).toEqual([]);
      expect(graph.createColumn).not.toHaveBeenCalled();
    });

    it('counts a column that already exists as created and carries on after other failures', async () => {
      graph.createColumn
        .mockRejectedValueOnce(new SharePointError('graph:nameAlreadyExists', false))
        .mockRejectedValueOnce(new SharePointError('graph:invalidRequest', false));

      const result = await setup.setUp(tenantId, configurationFor({ ...main, detailLists: [] }), 'household');

      expect(result.permissionDenied).toBe(false);
      expect(result.failures).toEqual([{ listId: 'main-list', name: 'FirstName', errorCode: 'graph:invalidRequest' }]);
      expect(result.createdColumns.map(({ name }) => name)).toEqual([
        'FilesFolder',
        'ContactMethods',
        'Income',
        'Untyped',
      ]);
    });

    it('does not create a column whose name SharePoint cannot use', async () => {
      const badName = { ...main, detailLists: [], fieldMappings: [{ source: 'a', target: 'First Name' }] };

      const result = await setup.setUp(tenantId, configurationFor(badName), 'household');

      expect(result.failures).toEqual([{ listId: 'main-list', name: 'First Name', errorCode: 'invalid-column-name' }]);
      expect(graph.createColumn.mock.calls.map(([, , , { name }]) => name)).not.toContain('First Name');
    });

    it('leaves a column of the wrong type alone', async () => {
      graph.lists.get('main-list').columns.push({ ...text('Income'), type: 'text' });

      const result = await setup.setUp(tenantId, configurationFor({ ...main, detailLists: [] }), 'household');

      expect(graph.createColumn.mock.calls.map(([, , , { name }]) => name)).not.toContain('Income');
      expect(result.report.lists[0].columns.find(({ name }) => name === 'Income').status).toBe('wrongType');
    });

    it('does not touch a main list that cannot be found', async () => {
      const missingMain = { ...main, listId: 'gone', detailLists: [] };

      const result = await setup.setUp(tenantId, configurationFor(missingMain), 'household');

      expect(graph.createColumn).not.toHaveBeenCalled();
      expect(result.report.lists[0].status).toBe('notFound');
    });
  });
});
