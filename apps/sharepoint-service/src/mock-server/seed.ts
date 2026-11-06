export type ColumnType = 'text' | 'number' | 'dateTime' | 'boolean';

export interface MockColumn {
  name: string;
  type: ColumnType;
  indexed?: boolean;
}

export interface MockList {
  listId: string;
  displayName: string;
  columns: MockColumn[];
}

export interface MockSite {
  siteId: string;
  displayName: string;
  grants: { clientId: string; role: 'read' | 'write' }[];
  lists: MockList[];
}

export interface MockAppRegistration {
  tenantId: string;
  clientId: string;
  secret: string;
  expiresAt: string;
}

export interface MockSeed {
  apps: MockAppRegistration[];
  sites: MockSite[];
}

export const DEMO_ENTRA_TENANT_ID = '11111111-1111-4111-8111-111111111111';
export const DEMO_CLIENT_ID = '22222222-2222-4222-8222-222222222222';
export const DEMO_CLIENT_SECRET = 'demo-secret-valid';
export const EXPIRED_CLIENT_ID = '33333333-3333-4333-8333-333333333333';
export const EXPIRED_CLIENT_SECRET = 'demo-secret-expired';
export const DEMO_SITE_ID =
  'contoso.sharepoint.com,5a58bb09-1fba-41c1-8125-69da264370a0,9f2ec1da-0be4-4a74-9254-973f0add78fd';
export const UNGRANTED_SITE_ID =
  'contoso.sharepoint.com,0b1e5a9e-6c1c-4f0c-9d0e-3f4a5b6c7d8e,1c2d3e4f-5a6b-4c7d-8e9f-0a1b2c3d4e5f';
export const DEMO_LIST_ID = 'b57f7a62-4c3b-4c89-9d1a-1cb7a5e56d9f';
export const UNGRANTED_LIST_ID = 'd3c1a2b4-5e6f-4a7b-8c9d-0e1f2a3b4c5d';
export const NO_KEY_LIST_ID = 'e4f5a6b7-8c9d-4e0f-9a1b-2c3d4e5f6a7b';

const logColumns: MockColumn[] = [
  { name: 'FirstName', type: 'text' },
  { name: 'Amount', type: 'number' },
];

const intakeColumns: MockColumn[] = [
  { name: 'AdspItemKey', type: 'text', indexed: true },
  { name: 'FirstName', type: 'text' },
  { name: 'LastName', type: 'text' },
  { name: 'Amount', type: 'number' },
  { name: 'SubmittedOn', type: 'dateTime' },
  { name: 'Consent', type: 'boolean' },
];

export const defaultSeed: MockSeed = {
  apps: [
    {
      tenantId: DEMO_ENTRA_TENANT_ID,
      clientId: DEMO_CLIENT_ID,
      secret: DEMO_CLIENT_SECRET,
      expiresAt: '2099-12-31T00:00:00Z',
    },
    {
      tenantId: DEMO_ENTRA_TENANT_ID,
      clientId: EXPIRED_CLIENT_ID,
      secret: EXPIRED_CLIENT_SECRET,
      expiresAt: '2025-01-01T00:00:00Z',
    },
  ],
  sites: [
    {
      siteId: DEMO_SITE_ID,
      displayName: 'HR intake site',
      grants: [
        { clientId: DEMO_CLIENT_ID, role: 'write' },
        { clientId: EXPIRED_CLIENT_ID, role: 'write' },
      ],
      lists: [
        { listId: DEMO_LIST_ID, displayName: 'Intake', columns: intakeColumns },
        { listId: NO_KEY_LIST_ID, displayName: 'Log (no AdspItemKey)', columns: logColumns },
      ],
    },
    {
      siteId: UNGRANTED_SITE_ID,
      displayName: 'Finance site (no grant)',
      grants: [],
      lists: [{ listId: UNGRANTED_LIST_ID, displayName: 'Payments', columns: intakeColumns }],
    },
  ],
};
