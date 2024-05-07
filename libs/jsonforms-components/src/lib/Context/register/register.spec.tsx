import React, { useContext, useState, useEffect } from 'react';
import { fireEvent, render, waitFor, screen } from '@testing-library/react';
import { JsonFormRegisterProvider, JsonFormsRegisterContext } from './registerContext';
import { RegisterConfig } from './actions';
import '@testing-library/jest-dom';
import { fetchRegister } from './util';
import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';
const mockHost = 'http://mock-api.com';

const TestComponent = (): JSX.Element => {
  const context = useContext(JsonFormsRegisterContext);
  useEffect(() => {
    context?.selectRegisterData(`${mockHost}/mock-test`);
    context?.fetchRegisterByUrl(`${mockHost}/mock-test`);
  }, [context]);
  return <div data-testid={'mock-test'}></div>;
};

describe('Jsonforms register context', () => {
  it('can render register context provider', async () => {
    render(
      <JsonFormRegisterProvider defaultRegisters={undefined} children={<div data-testid="mock-children"></div>} />
    );
    expect(screen.getByTestId('mock-children')).toBeTruthy();
  });

  it('can render invoke dispatch', async () => {
    render(<JsonFormRegisterProvider defaultRegisters={undefined} children={<TestComponent />} />);
    expect(screen.getByTestId('mock-test')).toBeTruthy();
  });

  it('can create context with default data', async () => {
    render(
      <JsonFormRegisterProvider
        defaultRegisters={[{ url: `${mockHost}/mock-url-1`, urn: 'mock-urn', data: ['item'] }]}
        children={<TestComponent />}
      />
    );
    expect(screen.getByTestId('mock-test')).toBeTruthy();
  });

  it('can create context with existing default data', async () => {
    render(
      <JsonFormRegisterProvider
        defaultRegisters={[{ url: `${mockHost}/mock-test`, urn: 'mock-urn', data: ['item'] }]}
        children={<TestComponent />}
      />
    );

    const axiosMock = new MockAdapter(axios);
    axiosMock.onGet(`${mockHost}/mock-test`).reply(200, ['item1', 'item2']);

    expect(screen.getByTestId('mock-test')).toBeTruthy();
  });

  it('can create context with existing default register config', async () => {
    render(
      <JsonFormRegisterProvider
        defaultRegisters={[{ url: `${mockHost}/mock-test`, urn: 'mock-urn' }]}
        children={<TestComponent />}
      />
    );
    expect(screen.getByTestId('mock-test')).toBeTruthy();
  });

  it('can fetch data based on response path', async () => {
    const config: RegisterConfig = {
      url: `${mockHost}/mock-deep-object`,
      responsePrefixPath: 'level1.level2.data',
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

    const fetchedData = await fetchRegister(config);
    expect(fetchedData[0]).toBe('item1');
  });

  it('can fetch data based on response path for object array', async () => {
    const config: RegisterConfig = {
      url: `${mockHost}/mock-deep-object`,
      responsePrefixPath: 'level1.level2.data',
      objectPathInArray: 'item',
    };
    const deepObject = {
      level1: {
        level2: {
          data: [
            {
              item: 'item1',
              id: '1',
            },
            {
              item: 'item2',
              id: '2',
            },
          ],
        },
      },
    };
    const axiosMock = new MockAdapter(axios);
    axiosMock.onGet(config.url).reply(200, deepObject);

    const fetchedData = await fetchRegister(config);
    expect(fetchedData[0]).toBe('item1');
  });

  it('can fetch data based on response without url', async () => {
    const config: RegisterConfig = { token: 'mock-token' };
    const fetchedData = await fetchRegister(config);
    expect(fetchedData).toBe(undefined);
  });
});
