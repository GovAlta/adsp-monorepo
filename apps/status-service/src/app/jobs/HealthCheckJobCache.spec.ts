import { Logger } from 'winston';
import { StaticApplicationData } from '../model';
import { HealthCheckJobCache } from './HealthCheckJobCache';
import { HealthCheckJob } from './HealthCheckJob';
import { StatusApplications } from '../model/statusApplications';

describe('HealthCheckJobCache', () => {
  const loggerMock: Logger = {
    debug: jest.fn(),
    info: jest.fn(),
    error: jest.fn(),
  } as unknown as Logger;

  const mockApplications: StaticApplicationData[] = [
    {
      name: 'App1',
      appKey: 'app_application-1',
      url: 'http://www.application1.com',
    },
    {
      name: 'App2',
      appKey: 'app_application-2',
      url: 'http://www.application2.com',
    },
    {
      name: 'app3',
      appKey: 'app_application-3',
      url: 'http://www.application3.com',
    },
  ];

  const cache = new HealthCheckJobCache(loggerMock);
  it('can add multiple application jobs', () => {
    const apps = StatusApplications.fromArray(mockApplications);
    cache.addBatch(apps, { schedule: jest.fn() });
    expect(cache.getApplicationIds().length).toEqual(3);
    expect(cache.get('app_application-1').getUrl()).toEqual('http://www.application1.com');
    expect(cache.get('app_application-2').getUrl()).toEqual('http://www.application2.com');
    expect(cache.get('app_application-3').getUrl()).toEqual('http://www.application3.com');
    expect(cache.get('toot!')).toBeNull;
    expect(cache.exists('app_application-1')).toBeTruthy;
    expect(cache.exists('app_application-2')).toBeTruthy;
    expect(cache.exists('app_application-3')).toBeTruthy;
    expect(cache.exists('app_application-4')).toBeFalsy;
  });

  it('can clear the cache', () => {
    cache.clear((job: HealthCheckJob) => {
      expect(job).not.toBeNull;
    });
    expect(cache.getApplicationIds().length).toEqual(0);
  });

  it('can update application jobs', () => {
    cache.clear(jest.fn());
    cache.addBatch(StatusApplications.fromArray(mockApplications), { schedule: jest.fn() });
    cache.remove('application 1', jest.fn());
    cache.add(
      { name: 'application 4', url: 'https://application/1', appKey: 'app_application-1' },
      { schedule: jest.fn() }
    );
    expect(cache.getApplicationIds().length).toEqual(3);
    expect(cache.get('app_application-1').getUrl()).toEqual('https://application/1');
  });
});
