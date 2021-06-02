import axios from 'axios';
import { Logger } from 'winston';
import { checkServiceHealth } from './healthCheck';

jest.mock('axios');
const axiosMock = axios as jest.Mocked<typeof axios>;

describe('checkServiceHealth', () => {
  const logger: Logger = ({
    debug: jest.fn(),
    info: jest.fn(),
    error: jest.fn(),
  } as unknown) as Logger;

  it('can check health', async (done) => {
    axiosMock.get.mockResolvedValueOnce({ status: 200 });
    const result = await checkServiceHealth(logger, new URL('http://test-co.org/health'));

    expect(result).toBeTruthy();
    done();
  });

  it('can return unhealthy for non-200', async (done) => {
    axiosMock.get.mockResolvedValueOnce({ status: 400 });
    const result = await checkServiceHealth(logger, new URL('http://test-co.org/health'));

    expect(result).toBeFalsy();
    done();
  });

  it('can return unhealthy for error', async (done) => {
    axiosMock.get.mockRejectedValueOnce(new Error('Something went terribly wrong.'));
    const result = await checkServiceHealth(logger, new URL('http://test-co.org/health'));

    expect(result).toBeFalsy();
    done();
  });
});
