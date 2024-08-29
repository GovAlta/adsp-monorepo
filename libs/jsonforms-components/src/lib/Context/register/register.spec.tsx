import React, { useContext, useState, useEffect } from 'react';
import { fireEvent, render, waitFor, screen } from '@testing-library/react';
import { JsonFormRegisterProvider, JsonFormsRegisterContext } from './registerContext';
import { RegisterConfig } from './actions';
import '@testing-library/jest-dom';
import { fetchRegister } from './util';
import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';

import { act } from 'react-dom/test-utils';
const mockHost = 'http://mock-api.com';

const TestComponent = (): JSX.Element => {
  const context = useContext(JsonFormsRegisterContext);
  useEffect(() => {
    context?.selectRegisterData({ url: `${mockHost}/mock-test` });
    context?.fetchRegisterByUrl({ url: `${mockHost}/mock-test` });
    context?.fetchErrors({ url: `${mockHost}/mock-test` });
  }, [context]);
  return <div data-testid={'mock-test'}></div>;
};
const TestUrn = (): JSX.Element => {
  const context = useContext(JsonFormsRegisterContext);
  useEffect(() => {
    context?.selectRegisterData({ urn: 'urn-test-item-one' });
    context?.fetchRegisterByUrl({ urn: 'urn-test-item-one' });
    context?.fetchErrors({ urn: 'urn-test-item-one' });
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
    await act(() => {
      render(
        <JsonFormRegisterProvider
          defaultRegisters={{
            registerData: [{ url: `${mockHost}/mock-url-1`, urn: 'mock-urn', data: ['item'] }],
            dataList: ['abc'],
            nonAnonymous: ['def'],
          }}
          children={<TestComponent />}
        />
      );
    });

    const axiosMock = new MockAdapter(axios);
    axiosMock.onGet(`${mockHost}/mock-test`).reply(200, ['item1', 'item2']);

    expect(screen.getByTestId('mock-test')).toBeTruthy();
  });

  it('can create context with existing default data', async () => {
    await act(() => {
      render(
        <JsonFormRegisterProvider
          defaultRegisters={{
            registerData: [{ url: `${mockHost}/mock-test`, urn: 'mock-urn', data: ['item'] }],
            dataList: ['abc'],
            nonAnonymous: ['def'],
          }}
          children={<TestComponent />}
        />
      );
    });

    const axiosMock = new MockAdapter(axios);
    axiosMock.onGet(`${mockHost}/mock-test`).reply(200, ['item1', 'item2']);

    expect(screen.getByTestId('mock-test')).toBeTruthy();
  });

  it('can create context with existing default register config', async () => {
    render(
      <JsonFormRegisterProvider
        defaultRegisters={{
          registerData: [{ url: `${mockHost}/mock-test`, urn: 'mock-urn', data: ['item'] }],
          dataList: ['abc'],
          nonAnonymous: ['def'],
        }}
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

    const fetchedData = (await fetchRegister(config)) || [];
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

    const fetchedData = (await fetchRegister(config)) || [];
    expect(fetchedData[0]).toBe('item1');
  });

  it('can fetch data based on response without url', async () => {
    const config: RegisterConfig = { token: 'mock-token' };
    const fetchedData = await fetchRegister(config);
    expect(fetchedData).toBe(undefined);
  });

  it('can create context with urn only', async () => {
    render(
      <JsonFormRegisterProvider
        defaultRegisters={{
          registerData: [{ urn: 'mock-urn', data: ['item'] }],
          dataList: ['abc'],
          nonAnonymous: ['def'],
        }}
        children={<TestUrn />}
      />
    );

    const axiosMock = new MockAdapter(axios);
    axiosMock.onGet(`${mockHost}/mock-test`).reply(200, ['item1', 'item2']);

    expect(screen.getByTestId('mock-test')).toBeTruthy();
  });
  it('can create context with urn only and data matches', async () => {
    render(
      <JsonFormRegisterProvider
        defaultRegisters={{
          registerData: [],
          dataList: ['item-one'],
          nonAnonymous: ['def'],
        }}
        children={<TestUrn />}
      />
    );

    expect(screen.getByTestId('mock-test')).toBeTruthy();
  });
  it('can create context with urn only and data does not match', async () => {
    render(
      <JsonFormRegisterProvider
        defaultRegisters={{
          registerData: [],
          dataList: ['item-two'],
          nonAnonymous: ['def'],
        }}
        children={<TestUrn />}
      />
    );

    expect(screen.getByTestId('mock-test')).toBeTruthy();
  });

  it('can create context with urn only tries to use anonymous urn', async () => {
    render(
      <JsonFormRegisterProvider
        defaultRegisters={{
          registerData: [],
          dataList: ['item-one'],
          nonAnonymous: ['item-one'],
        }}
        children={<TestUrn />}
      />
    );

    expect(screen.getByTestId('mock-test')).toBeTruthy();
  });

  it('can create context with urn only is not in anonymous list', async () => {
    render(
      <JsonFormRegisterProvider
        defaultRegisters={{
          registerData: [],
          dataList: ['item-one'],
          nonAnonymous: ['item-two'],
        }}
        children={<TestUrn />}
      />
    );

    expect(screen.getByTestId('mock-test')).toBeTruthy();
  });

  it('can create context starting with an error', async () => {
    await act(() => {
      render(
        <JsonFormRegisterProvider
          defaultRegisters={{
            registerData: [{ errors: { anError: { message: 'error here', url: 'http://test.test' } } }],
            dataList: ['item-one'],
            nonAnonymous: ['item-two'],
          }}
          children={<TestUrn />}
        />
      );
    });

    expect(screen.getByTestId('mock-test')).toBeTruthy();
  });
});
