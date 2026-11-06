import { SharepointConnection, SharepointDestination } from './actions';

export const defaultConnection: SharepointConnection = {
  id: '',
  name: '',
  entraTenantId: '',
  clientId: '',
  siteId: '',
};

export const defaultDestination: SharepointDestination = {
  id: '',
  name: '',
  connectionId: '',
  listId: '',
  fieldMappings: [{ source: '', target: '' }],
  idempotencyFields: ['_adsp.key'],
  enabled: true,
};
