import axios from 'axios';
import { configureStore } from '@reduxjs/toolkit';
import { configReducer, initializeConfig } from './slice';
import { environment as staticEnvironment } from '../../../environments/environment';

jest.mock('axios', () => ({ __esModule: true, default: { get: jest.fn() } }));

describe('initializeConfig', () => {
  const get = axios.get as jest.Mock;
  const runtime = {
    production: true,
    directory: { url: 'https://directory.example' },
    access: {
      url: 'https://access.example',
      realm: 'planner-realm',
      client_id: 'urn:ads:platform:project-planner-app',
    },
  };
  const directoryEntries = [
    { urn: 'urn:ads:platform:project-planner-service', url: 'https://planner-service.example' },
  ];

  const run = async () => {
    const store = configureStore({ reducer: { config: configReducer } });
    await store.dispatch(initializeConfig());
    return store.getState().config;
  };

  const respond = (config: unknown, directory: unknown = directoryEntries) =>
    get.mockImplementation((url: string) =>
      url === '/config/config.json' ? Promise.resolve({ data: config }) : Promise.resolve({ data: directory }),
    );

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('uses /config/config.json over the built-in environment', async () => {
    respond(runtime);

    expect((await run()).environment).toEqual(runtime);
  });

  it('falls back to the built-in environment when config.json is not a config object', async () => {
    respond('<!DOCTYPE html>');

    expect((await run()).environment).toEqual(staticEnvironment);
  });

  it('takes the planner service URL from the platform directory', async () => {
    respond(runtime);

    expect((await run()).serviceUrls.projectPlannerServiceApiUrl).toBe('https://planner-service.example');
  });

  it('uses the serviceUrl override over the directory', async () => {
    respond({ ...runtime, serviceUrl: 'http://localhost:3381' });

    expect((await run()).serviceUrls.projectPlannerServiceApiUrl).toBe('http://localhost:3381');
  });

  it('leaves the service URL unset when the directory has no planner entry', async () => {
    respond(runtime, []);

    expect((await run()).serviceUrls.projectPlannerServiceApiUrl).toBeUndefined();
  });

  it('marks the config initialized', async () => {
    respond(runtime);

    expect((await run()).initialized).toBe(true);
  });
});
