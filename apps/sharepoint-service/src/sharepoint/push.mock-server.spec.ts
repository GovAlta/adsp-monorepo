import { adspId } from '@abgov/adsp-service-sdk';
import axios from 'axios';
import { once } from 'events';
import { Server } from 'http';
import { AddressInfo } from 'net';
import { createSharePointMockApp } from '../mock-server/app';
import {
  defaultSeed,
  DEMO_CLIENT_ID,
  DEMO_CLIENT_SECRET,
  DEMO_DETAIL_LIST_ID,
  DEMO_ENTRA_TENANT_ID,
  DEMO_LIBRARY_ID,
  DEMO_LIST_ID,
  DEMO_SITE_ID,
} from '../mock-server/seed';
import { MockState } from '../mock-server/state';
import { GraphClient, GraphFileClient, GraphTokenProvider } from './graph';
import { LibraryDriveResolver } from './libraryDrives';
import { SharePointPusher } from './push';
import { SharePointSetup } from './setup';
import { SharePointConfiguration } from './types';

describe('SharePoint service against the mock server', () => {
  const tenantId = adspId`urn:ads:platform:tenant-service:v2:/tenants/test`;
  const configuration: SharePointConfiguration = {
    connections: {
      'hr-site': {
        id: 'hr-site',
        name: 'HR',
        entraTenantId: DEMO_ENTRA_TENANT_ID,
        clientId: DEMO_CLIENT_ID,
        siteId: DEMO_SITE_ID,
      },
    },
    destinations: {
      household: {
        id: 'household',
        name: 'Household',
        connectionId: 'hr-site',
        listId: DEMO_LIST_ID,
        fieldMappings: [
          { source: 'applicant.firstName', target: 'FirstName' },
          { source: 'contactMethods', target: 'ContactMethods' },
        ],
        idempotencyFields: ['_adsp.key'],
        detailLists: [
          {
            listId: DEMO_DETAIL_LIST_ID,
            dataPath: 'householdMembers',
            parentRefField: 'ParentItemId',
            fieldMappings: [
              { source: 'name', target: 'MemberName' },
              { source: 'age', target: 'Age' },
            ],
          },
        ],
      },
    },
  };

  let server: Server;
  let state: MockState;
  let pusher: SharePointPusher;
  let graph: GraphClient;
  let fileClient: GraphFileClient;
  let tokens: { getToken: () => Promise<string>; evict: jest.Mock };

  const tokenFor = async (base: string): Promise<string> =>
    (
      await axios.post(
        `${base}/${DEMO_ENTRA_TENANT_ID}/oauth2/v2.0/token`,
        new URLSearchParams({
          grant_type: 'client_credentials',
          client_id: DEMO_CLIENT_ID,
          client_secret: DEMO_CLIENT_SECRET,
        }),
      )
    ).data.access_token;

  beforeAll(async () => {
    state = new MockState(defaultSeed);
    server = createSharePointMockApp(state).listen(0, '127.0.0.1');
    await once(server, 'listening');
    const base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
    const token = await tokenFor(base);
    tokens = { getToken: async () => token, evict: jest.fn() };
    graph = new GraphClient(`${base}/v1.0`);
    fileClient = new GraphFileClient(`${base}/v1.0`);
    pusher = new SharePointPusher(tokens as unknown as GraphTokenProvider, graph);
  });

  afterAll(() => {
    server.close();
  });

  it('keeps the detail list exactly as it was when one new detail row fails, then corrects it on a retry', async () => {
    const submission = (members: { name: string; age: unknown }[]) => ({
      applicant: { firstName: 'Ada' },
      householdMembers: members,
      _adsp: { key: 'submission-retry' },
    });
    const first = await pusher.push(tenantId, configuration, 'household', submission([{ name: 'Old', age: 50 }]));
    const childrenOf = () =>
      members()
        .filter(({ ParentItemId }) => ParentItemId === first.itemId)
        .map(({ MemberName, Age }) => [MemberName, Age]);

    const failed = await pusher
      .push(
        tenantId,
        configuration,
        'household',
        submission([
          { name: 'New 1', age: 1 },
          { name: 'New 2', age: 'not a number' },
          { name: 'New 3', age: 3 },
        ]),
      )
      .catch((err) => err);

    expect(failed.detailFailures).toEqual([{ listId: DEMO_DETAIL_LIST_ID, indexes: [1], column: 'Age' }]);
    expect(childrenOf()).toEqual([['Old', 50]]);

    await pusher.push(
      tenantId,
      configuration,
      'household',
      submission([
        { name: 'New 1', age: 1 },
        { name: 'New 2', age: 2 },
        { name: 'New 3', age: 3 },
      ]),
    );
    expect(childrenOf()).toEqual([
      ['New 1', 1],
      ['New 2', 2],
      ['New 3', 3],
    ]);
  });

  it('sets up a destination whose detail list and columns do not exist yet, then pushes to it', async () => {
    const fresh: SharePointConfiguration = {
      ...configuration,
      destinations: {
        pets: {
          id: 'pets',
          name: 'Pets',
          connectionId: 'hr-site',
          listId: DEMO_LIST_ID,
          fieldMappings: [{ source: 'applicant.firstName', target: 'FirstName' }],
          idempotencyFields: ['_adsp.key'],
          detailLists: [
            {
              listName: 'Pets',
              dataPath: 'pets',
              parentRefField: 'OwnerItemId',
              fieldMappings: [
                { source: 'name', target: 'PetName', columnType: 'text', displayName: 'Pet name' },
                { source: 'vaccinated', target: 'Vaccinated', columnType: 'boolean' },
              ],
            },
          ],
        },
      },
    };
    const setup = new SharePointSetup(
      tokens as unknown as GraphTokenProvider,
      graph,
      new LibraryDriveResolver(tokens as unknown as GraphTokenProvider, fileClient),
    );

    expect((await setup.verify(tenantId, fresh, 'pets')).ready).toBe(false);
    const result = await setup.setUp(tenantId, fresh, 'pets');

    expect(result.permissionDenied).toBe(false);
    expect(result.failures).toEqual([]);
    expect(result.report.ready).toBe(true);
    const [{ listId }] = result.createdLists;
    fresh.destinations.pets.detailLists[0].listId = listId;

    const pushed = await pusher.push(tenantId, fresh, 'pets', {
      applicant: { firstName: 'Ada' },
      pets: [{ name: 'Rex', vaccinated: true }],
      _adsp: { key: 'submission-pets' },
    });

    expect(state.listItems(listId).map(({ fields }) => fields)).toEqual([
      { PetName: 'Rex', Vaccinated: true, OwnerItemId: pushed.itemId },
    ]);
  });

  it('verifies a chosen document library, and reports an ordinary list given as one', async () => {
    const setup = new SharePointSetup(
      tokens as unknown as GraphTokenProvider,
      graph,
      new LibraryDriveResolver(tokens as unknown as GraphTokenProvider, fileClient),
    );
    const withLibrary = (documentFilesLibraryId: string): SharePointConfiguration => ({
      ...configuration,
      destinations: { household: { ...configuration.destinations.household, documentFilesLibraryId } },
    });

    const library = await setup.verify(tenantId, withLibrary(DEMO_LIBRARY_ID), 'household');
    const ordinaryList = await setup.verify(tenantId, withLibrary(DEMO_LIST_ID), 'household');

    expect(library.documentLibrary).toEqual({ libraryId: DEMO_LIBRARY_ID, status: 'ok' });
    expect(ordinaryList.documentLibrary).toEqual({ libraryId: DEMO_LIST_ID, status: 'notADocumentLibrary' });
    expect(ordinaryList.ready).toBe(false);
  });

  it('creates a named document library during setup', async () => {
    const setup = new SharePointSetup(
      tokens as unknown as GraphTokenProvider,
      graph,
      new LibraryDriveResolver(tokens as unknown as GraphTokenProvider, fileClient),
    );
    const named: SharePointConfiguration = {
      ...configuration,
      destinations: {
        household: { ...configuration.destinations.household, documentFilesLibraryName: 'Household uploads' },
      },
    };

    const result = await setup.setUp(tenantId, named, 'household');

    expect(result.createdLibrary).toEqual({ libraryName: 'Household uploads', libraryId: expect.any(String) });
    expect(result.report.documentLibrary).toMatchObject({ libraryId: result.createdLibrary.libraryId, status: 'ok' });
  });

  it('reports that an app with only the write role cannot set up a destination', async () => {
    const writeOnly = new MockState({
      ...defaultSeed,
      sites: defaultSeed.sites.map((site) => ({
        ...site,
        grants: site.grants.map((grant) => ({ ...grant, role: 'write' as const })),
      })),
    });
    const writeServer = createSharePointMockApp(writeOnly).listen(0, '127.0.0.1');
    await once(writeServer, 'listening');
    try {
      const base = `http://127.0.0.1:${(writeServer.address() as AddressInfo).port}`;
      const writeTokens = { getToken: async () => tokenFor(base), evict: jest.fn() };
      const setup = new SharePointSetup(
        writeTokens as unknown as GraphTokenProvider,
        new GraphClient(`${base}/v1.0`),
        new LibraryDriveResolver(writeTokens as unknown as GraphTokenProvider, new GraphFileClient(`${base}/v1.0`)),
      );
      const destination = {
        ...configuration.destinations.household,
        fieldMappings: [{ source: 'notes', target: 'Notes', columnType: 'multilineText' as const }],
        detailLists: [],
      };

      const result = await setup.setUp(
        tenantId,
        { ...configuration, destinations: { household: destination } },
        'household',
      );

      expect(result.permissionDenied).toBe(true);
      expect(result.report.lists[0].columns.find(({ name }) => name === 'Notes').status).toBe('missing');
    } finally {
      writeServer.close();
    }
  });

  const members = () => state.listItems(DEMO_DETAIL_LIST_ID).map(({ fields }) => fields);
  const mainRows = (key: string) => state.listItems(DEMO_LIST_ID).filter(({ fields }) => fields.AdspItemKey === key);

  it('writes a submission with its detail rows, then replaces them on a re-push', async () => {
    const first = await pusher.push(tenantId, configuration, 'household', {
      applicant: { firstName: 'Ada' },
      contactMethods: ['Email', 'Phone'],
      householdMembers: [
        { name: 'Bo', age: 9 },
        { name: 'Cy', age: 7 },
        { name: 'Di', age: 4 },
      ],
      _adsp: { key: 'submission-1' },
    });

    expect(first.outcome).toBe('created');
    expect(first.detailRows[0].rowIds).toHaveLength(3);
    expect(mainRows('submission-1').map(({ fields }) => fields)).toEqual([
      {
        FirstName: 'Ada',
        ContactMethods: ['Email', 'Phone'],
        AdspItemKey: 'submission-1',
      },
    ]);
    expect(members().filter(({ ParentItemId }) => ParentItemId === first.itemId)).toEqual([
      { MemberName: 'Bo', Age: 9, ParentItemId: first.itemId },
      { MemberName: 'Cy', Age: 7, ParentItemId: first.itemId },
      { MemberName: 'Di', Age: 4, ParentItemId: first.itemId },
    ]);

    const second = await pusher.push(tenantId, configuration, 'household', {
      applicant: { firstName: 'Ada' },
      contactMethods: [],
      householdMembers: [
        { name: 'Bo', age: 10 },
        { name: 'Ed', age: 1 },
      ],
      _adsp: { key: 'submission-1' },
    });

    expect(second).toEqual(expect.objectContaining({ itemId: first.itemId, outcome: 'updated' }));
    expect(mainRows('submission-1')).toHaveLength(1);
    expect(mainRows('submission-1')[0].fields.ContactMethods).toEqual([]);
    expect(members().filter(({ ParentItemId }) => ParentItemId === first.itemId)).toEqual([
      { MemberName: 'Bo', Age: 10, ParentItemId: first.itemId },
      { MemberName: 'Ed', Age: 1, ParentItemId: first.itemId },
    ]);
  });
});
