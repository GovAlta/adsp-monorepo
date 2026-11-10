import { SharepointConnection, SharepointDestination } from './actions';

// Any caller can send _adsp.key in the pushed data to update the same row on later pushes.
export const ADSP_KEY_FIELD = '_adsp.key';

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
  idempotencyFields: [ADSP_KEY_FIELD],
  enabled: true,
};
