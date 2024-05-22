import React from 'react';

import { RegisterConfig } from './actions';
import '@testing-library/jest-dom';

import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';

import { validateUrl } from './util';
const mockHost = 'http://mock-api.com';

describe('Jsonforms register context', () => {
  it('returns true if api call was successful', async () => {
    const config: RegisterConfig = {
      url: `${mockHost}/mock-deep-object`,
    };
    const deepObject = {
      level1: {
        level2: {
          data: ['item1', 'item2'],
        },
      },
    };
    const axiosMock = new MockAdapter(axios);
    axiosMock.onGet(config.url).reply(200, deepObject);

    const response = await validateUrl(config);
    expect(response).toBe(true);
  });
  it('returns false if api call was not successful', async () => {
    const config: RegisterConfig = {
      url: `${mockHost}/mock-deep-object`,
    };
    const deepObject = {
      level1: {
        level2: {
          data: ['item1', 'item2'],
        },
      },
    };
    const axiosMock = new MockAdapter(axios);
    axiosMock.onGet(config.url).reply(404, deepObject);

    const response = await validateUrl(config);
    expect(response).toBe(false);
  });
});
