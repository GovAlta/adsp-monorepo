import { ApplicationList } from '../ApplicationList';
import { ApplicationData } from '../serviceStatus';

describe('ApplicationList', () => {
  const applications: Record<string, ApplicationData> = {
    ['620ae946ddd181001195caad']: {
      _id: '620ae946ddd181001195caad',
      name: 'temp app name 1',
      url: 'https://www.yahoo.com',
      description: 'Woof.',
      status: 'operational',
      metadata: '',
      statusTimestamp: 1648247257463,
      tenantId: 'urn:ads:mock-tenant:mock-service:bob:bobs-id',
      tenantName: 'Platform',
      tenantRealm: '1b0dbf9a-58be-4604-b995-18ff15dcdfd5',
      enabled: true,
    },
    ['620ae946ddd181001195cbbc']: {
      _id: '620ae946ddd181001195cbbc',
      name: 'temp app name 2',
      url: 'https://www.google.com',
      description: 'Toot!',
      metadata: '',
      statusTimestamp: 1648247257464,
      tenantId: 'urn:ads:mock-tenant:mock-service:bill:bills-id',
      tenantName: 'Platform',
      tenantRealm: '1b0dbf9a-58be-4604-b995-18ff15dcdfd5',
      status: 'operational',
      enabled: true,
    },
  };

  it('Can map', () => {
    const apps = new ApplicationList(applications);
    const result = apps.map((a) => a.url);
    expect(result.length).toEqual(2);
    expect(result[0]).toEqual('https://www.yahoo.com');
    expect(result[1]).toEqual('https://www.google.com');
  });

  it('Can filter', () => {
    const apps = new ApplicationList(applications);
    const result = apps.filter((a) => a.description == applications['620ae946ddd181001195caad'].description);
    expect(result.length).toEqual(1);
    expect(result[0].url).toEqual('https://www.yahoo.com');
  });

  it('Can loop', () => {
    const apps = new ApplicationList(applications);
    const result = [];
    apps.forEach((a) => result.push(a));
    expect(result.length).toEqual(2);
    expect(result[0].url).toEqual('https://www.yahoo.com');
    expect(result[1].url).toEqual('https://www.google.com');
  });

  it('Can allow data access like a hash', () => {
    const apps = new ApplicationList(applications);
    const app2 = apps['620ae946ddd181001195cbbc'];
    expect(app2.url).toEqual('https://www.google.com');
  });

  it('Can be built from an array', () => {
    const apps = ApplicationList.fromArray([
      applications['620ae946ddd181001195caad'],
      applications['620ae946ddd181001195cbbc'],
    ]);
    expect(apps['620ae946ddd181001195caad'].url).toEqual('https://www.yahoo.com');
    expect(apps['620ae946ddd181001195cbbc'].url).toEqual('https://www.google.com');
  });
});
