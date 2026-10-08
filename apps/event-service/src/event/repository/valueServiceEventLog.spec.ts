import { adspId } from '@abgov/adsp-service-sdk';
import axios from 'axios';
import { ValueServiceEventLogRepository } from './valueServiceEventLog';

jest.mock('axios');
const axiosMock = axios as jest.Mocked<typeof axios>;

function getRequestParams(): Record<string, string> {
  return (axiosMock.get.mock.calls[0][1] as { params: Record<string, string> }).params;
}

describe('ValueServiceEventLogRepository', () => {
  const tenantId = adspId`urn:ads:platform:tenant-service:v2:/tenants/test`;
  const valueServiceUrl = new URL('https://value-service/value/v1');

  const directoryMock = { getServiceUrl: jest.fn() };
  const tokenProviderMock = { getAccessToken: jest.fn() };

  beforeEach(() => {
    directoryMock.getServiceUrl.mockReset().mockResolvedValue(valueServiceUrl);
    tokenProviderMock.getAccessToken.mockReset().mockResolvedValue('token');
    axiosMock.get.mockReset();
  });

  it('can count events with no criteria', async () => {
    axiosMock.get.mockResolvedValueOnce({ data: { count: 42 } });
    const repository = new ValueServiceEventLogRepository(directoryMock as never, tokenProviderMock as never);

    const result = await repository.countEvents(tenantId, {});

    expect(result).toBe(42);
    expect(axiosMock.get).toHaveBeenCalledWith(
      'https://value-service/value/v1/event-service/values/event/count',
      expect.objectContaining({
        headers: { Authorization: 'Bearer token' },
        params: expect.objectContaining({ tenantId: tenantId.toString() }),
      }),
    );
    const params = getRequestParams();
    expect(params.context).toBeUndefined();
    expect(params.timestampMin).toBeUndefined();
    expect(params.timestampMax).toBeUndefined();
    expect(params.correlationId).toBeUndefined();
  });

  it('can count events filtered by namespace only', async () => {
    axiosMock.get.mockResolvedValueOnce({ data: { count: 7 } });
    const repository = new ValueServiceEventLogRepository(directoryMock as never, tokenProviderMock as never);

    await repository.countEvents(tenantId, { namespace: 'application-events' });

    const params = getRequestParams();
    expect(JSON.parse(params.context)).toEqual({ namespace: 'application-events' });
  });

  it('can count events filtered by name only', async () => {
    axiosMock.get.mockResolvedValueOnce({ data: { count: 3 } });
    const repository = new ValueServiceEventLogRepository(directoryMock as never, tokenProviderMock as never);

    await repository.countEvents(tenantId, { name: 'user-registration' });

    const params = getRequestParams();
    expect(JSON.parse(params.context)).toEqual({ name: 'user-registration' });
  });

  it('can combine namespace, name, timestamp range, and correlation ID', async () => {
    axiosMock.get.mockResolvedValueOnce({ data: { count: 1 } });
    const repository = new ValueServiceEventLogRepository(directoryMock as never, tokenProviderMock as never);

    const timestampMin = new Date('2021-03-23T12:00:00Z');
    const timestampMax = new Date('2021-03-24T12:00:00Z');
    await repository.countEvents(tenantId, {
      namespace: 'application-events',
      name: 'user-registration',
      timestampMin,
      timestampMax,
      correlationId: 'Bobs-user-id',
    });

    const params = getRequestParams();
    expect(JSON.parse(params.context)).toEqual({ namespace: 'application-events', name: 'user-registration' });
    expect(params.timestampMin).toBe(timestampMin.toISOString());
    expect(params.timestampMax).toBe(timestampMax.toISOString());
    expect(params.correlationId).toBe('Bobs-user-id');
  });

  it('defaults count to 0 when the response has no count', async () => {
    axiosMock.get.mockResolvedValueOnce({ data: {} });
    const repository = new ValueServiceEventLogRepository(directoryMock as never, tokenProviderMock as never);

    const result = await repository.countEvents(tenantId, {});

    expect(result).toBe(0);
  });

  it('propagates an error from the value service', async () => {
    const err = new Error('upstream failure');
    axiosMock.get.mockRejectedValueOnce(err);
    const repository = new ValueServiceEventLogRepository(directoryMock as never, tokenProviderMock as never);

    await expect(repository.countEvents(tenantId, {})).rejects.toBe(err);
  });
});
