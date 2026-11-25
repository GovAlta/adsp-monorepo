import axios from 'axios';
import type {
  ClientSecretClient,
  ClientSecretsApi,
  RealmRotationMode,
  RotationSchedule,
  RotationSettings,
} from './clientSecretsApi';

const REALM_PATH = '/rotation/v1/realm';
const CLIENTS_PATH = '/rotation/v1/clients';

// Surfaces the API's own message, which explains the failure (for example an invalid schedule).
function toError(err: unknown): Error {
  const message = axios.isAxiosError(err) ? err.response?.data?.errorMessage : undefined;
  return new Error(message ?? (err instanceof Error ? err.message : 'Request failed.'));
}

/**
 * Client secret rotation API of the signed-in tenant's realm. Per-client calls use the Keycloak client ID, which the
 * list returns next to the internal ID that the tab works with.
 */
export function createClientSecretsApi(
  getBaseUrl: () => string | undefined,
  getToken: () => Promise<string | undefined>,
): ClientSecretsApi {
  const clientIds = new Map<string, string>();

  const request = async <T>(method: 'get' | 'put' | 'post' | 'patch', path: string, data?: unknown): Promise<T> => {
    const baseUrl = getBaseUrl();
    const token = await getToken();
    if (!baseUrl || !token) {
      throw new Error('Client secret rotation service is not available.');
    }
    try {
      const { data: result } = await axios.request<T>({
        method,
        url: new URL(path, baseUrl).href,
        data,
        headers: { Authorization: `Bearer ${token}` },
      });
      return result;
    } catch (err) {
      throw toError(err);
    }
  };

  const clientPath = (id: string, action = '') => {
    const clientId = clientIds.get(id);
    if (!clientId) {
      throw new Error('Client not found.');
    }
    return `${CLIENTS_PATH}/${encodeURIComponent(clientId)}${action}`;
  };

  return {
    async settings() {
      const { mode, expirationPeriod, rotatedExpirationPeriod, noticePeriod, minNoticeGapDays } =
        await request<RotationSettings>('get', REALM_PATH);
      return { mode, expirationPeriod, rotatedExpirationPeriod, noticePeriod, minNoticeGapDays };
    },
    async setMode(mode: RealmRotationMode) {
      await request('put', REALM_PATH, { mode });
    },
    async saveSchedule(schedule: RotationSchedule) {
      await request('put', REALM_PATH, schedule);
    },
    async list() {
      const clients = await request<ClientSecretClient[]>('get', CLIENTS_PATH);
      clientIds.clear();
      clients.forEach(({ id, clientId }) => clientIds.set(id, clientId));
      return clients;
    },
    async setOptIn(id, optedIn) {
      await request('put', clientPath(id, '/opt-in'), { enabled: optedIn });
    },
    async rotate(id) {
      await request('post', clientPath(id, '/rotate'));
    },
    async invalidateRotated(id) {
      await request('post', clientPath(id, '/invalidate-previous'));
    },
    async notify(id) {
      await request('post', clientPath(id, '/notify'));
    },
  };
}
