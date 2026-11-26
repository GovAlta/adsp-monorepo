import axios from 'axios';
import { createClientSecretsApi } from './clientSecretsHttpApi';

jest.mock('axios');
const axiosMock = axios as jest.Mocked<typeof axios>;

describe('createClientSecretsApi', () => {
  const api = createClientSecretsApi(
    () => 'https://rotation.example.com',
    async () => 'token',
  );

  beforeEach(() => {
    axiosMock.request.mockReset();
    axiosMock.isAxiosError.mockImplementation((err) => !!(err as { response?: unknown })?.response);
  });

  it('calls client endpoints by the Keycloak client ID, encoded', async () => {
    axiosMock.request.mockResolvedValueOnce({
      data: [{ id: 'kc-1', clientId: 'urn:ads:test:client', contacts: [], optedIn: true, status: 'ok' }],
    });
    await api.list();

    axiosMock.request.mockResolvedValueOnce({ data: {} });
    await api.rotate('kc-1');

    expect(axiosMock.request).toHaveBeenLastCalledWith(
      expect.objectContaining({
        method: 'post',
        url: 'https://rotation.example.com/api/rotation/v1/clients/urn%3Aads%3Atest%3Aclient/rotate',
        headers: { Authorization: 'Bearer token' },
      }),
    );
  });

  it('rejects an unknown client without calling the API', async () => {
    await expect(api.notify('unknown')).rejects.toThrow('Client not found.');
    expect(axiosMock.request).not.toHaveBeenCalled();
  });

  it('saves the schedule on the realm', async () => {
    axiosMock.request.mockResolvedValueOnce({ data: {} });
    const schedule = { expirationPeriod: 10368000, noticePeriod: 5184000, rotatedExpirationPeriod: 604800 };

    await api.saveSchedule(schedule);

    expect(axiosMock.request).toHaveBeenCalledWith(
      expect.objectContaining({ method: 'put', url: 'https://rotation.example.com/api/rotation/v1/realm', data: schedule }),
    );
  });

  it('surfaces the message from the API', async () => {
    axiosMock.request.mockRejectedValueOnce({ response: { data: { errorMessage: 'expiryDays must be above zero.' } } });
    await expect(api.setMode('selected')).rejects.toThrow('expiryDays must be above zero.');
  });

  it('fails when the service is not in the directory', async () => {
    const unavailable = createClientSecretsApi(
      () => undefined,
      async () => 'token',
    );
    await expect(unavailable.settings()).rejects.toThrow('not available');
  });
});
