import React, { ReactNode, useContext } from 'react';
import { render } from '@testing-library/react';
import '@testing-library/jest-dom';
import { enumerators, ContextProviderC, ContextProviderFactory } from '.';
import axios from 'axios';
import { JsonFormContext } from '.';

export const ContextProvider = ContextProviderFactory();

jest.mock('axios');

describe('addDataByOptions', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should add data by options', async () => {
    const key = 'testKey';
    const url = 'http://example.com/data';
    const location = ['nested', 'data'];
    const type = 'values';
    const values = ['firstName', 'lastName'];

    const responseData = {
      nested: {
        data: [
          { firstName: 'Bob', lastName: 'Smith' },
          { firstName: 'Jim', lastName: 'Jones' },
        ],
      },
    };

    // Mocking axios.get to return the response data
    jest.spyOn(axios, 'get').mockResolvedValue({ data: responseData });

    // Calling the function

    await ContextProviderC.addDataByOptions(key, url, location, type, values);

    // Expecting processDataFunction to be called with the response data
    expect(ContextProviderC.getFormContextData('testKey')).toEqual(['Bob Smith', 'Jim Jones']);
    expect(ContextProviderC.getAllFormContextData()).toEqual([{ testKey: ['Bob Smith', 'Jim Jones'] }]);
  });
  it('should add data by options single location single name', async () => {
    const key = 'testKey';
    const url = 'http://example.com/data';
    const location = 'nested';
    const type = 'values';
    const values = 'firstName';

    const responseData = {
      nested: [
        { firstName: 'Bob', lastName: 'Smith' },
        { firstName: 'Jim', lastName: 'Jones' },
      ],
    };

    // Mocking axios.get to return the response data
    jest.spyOn(axios, 'get').mockResolvedValue({ data: responseData });

    // Calling the function
    await ContextProviderC.addDataByOptions(key, url, location, type, values);

    // Expecting processDataFunction to be called with the response data
    expect(ContextProviderC.getFormContextData('testKey')).toEqual(['Bob', 'Jim']);
    expect(ContextProviderC.getAllFormContextData()).toEqual([{ testKey: ['Bob', 'Jim'] }]);
  });

  it('should add data by options with keys', async () => {
    const key = 'testKey';
    const url = 'http://example.com/data';
    const location = ['nested', 'data'];
    const type = 'keys';

    const responseData = {
      nested: {
        data: { 'Bob Smith': 'abc', 'Jim Jones': '234' },
      },
    };

    // Mocking axios.get to return the response data
    jest.spyOn(axios, 'get').mockResolvedValue({ data: responseData });

    // Calling the function
    await ContextProviderC.addDataByOptions(key, url, location, type);

    // Expecting processDataFunction to be called with the response data
    expect(ContextProviderC.getFormContextData('testKey')).toEqual(['Bob Smith', 'Jim Jones']);
    expect(ContextProviderC.getAllFormContextData()).toEqual([{ testKey: ['Bob Smith', 'Jim Jones'] }]);
  });

  it('should add data with addFormContextData', async () => {
    const data = { FirstName: 'Bob Smith', ' LastName': 'Jim Jones' };
    ContextProviderC.addFormContextData('testKey', data);
    expect(ContextProviderC.getFormContextData('testKey')).toEqual(data);
  });

  it('throws cors error when there is no data', async () => {
    function processData(rawData: object): string[] {
      return Object.keys(rawData);
    }
    const mockWarn = jest.spyOn(console, 'warn').mockImplementation(() => {});

    (axios.get as jest.Mock).mockRejectedValue(new Error('Axios request failed'));

    const key = 'testKey';
    const url = 'http://example.com/data';
    await ContextProviderC.addDataByUrl(key, url, processData);

    expect(mockWarn).toHaveBeenCalledWith('addDataByUrl: Axios request failed');
    mockWarn.mockRestore(); // Restore original console.warn
  });
  it('throws error', async () => {
    function processData(rawData: object): string[] {
      return Object.keys(rawData);
    }

    const logSpy = jest.spyOn(console, 'warn');

    (axios.get as jest.Mock).mockRejectedValue(new Error('Axios request failed'));

    const key = 'testKey';
    const url = 'http://example.com/data';
    await ContextProviderC.addDataByUrl(key, url, processData);

    expect(logSpy).toHaveBeenCalledWith('addDataByUrl: Axios request failed');
  });
  it('throws error related to cors', async () => {
    function processData(rawData: object): string[] {
      return Object.keys(rawData);
    }

    const logSpy = jest.spyOn(console, 'warn');

    (axios.get as jest.Mock).mockRejectedValue(new Error('CORS ERROR'));

    const key = 'testKey';
    const url = 'http://example.com/data';
    await ContextProviderC.addDataByUrl(key, url, processData);

    expect(logSpy).toHaveBeenCalledWith('CORS ERROR');
  });

  it('adds data by url with token and processing function', async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    function processData(rawData: any): string[] {
      console.log(JSON.stringify(rawData.nested.data) + '<rawData.nested.data');
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return rawData.nested.data.map((person: any) => `${person.firstName} ${person.lastName}`);
    }

    const responseData = {
      nested: {
        data: [
          { firstName: 'Bob', lastName: 'Smith' },
          { firstName: 'Jim', lastName: 'Jones' },
        ],
      },
    };
    jest.spyOn(axios, 'get').mockResolvedValue({ data: responseData });
    const key = 'testKey';
    const token = 'testToken';
    const url = 'http://example.com/data';
    await ContextProviderC.addDataByUrl(key, url, processData, token);
    expect(ContextProviderC.getFormContextData('testKey')).toEqual(['Bob Smith', 'Jim Jones']);
  });
});

describe('contextProvider', () => {
  const mockJsonFormContextValue = {
    data: new Map(),
    functions: new Map(),
    submitFunction: new Map([['submit-form', jest.fn()]]),
  };

  jest.mock('.', () => ({
    ...jest.requireActual('.'),
    JsonFormContext: {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      Consumer: ({ children }: { children: (value: any) => React.ReactNode }) => children(mockJsonFormContextValue),
    },
  }));
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('allows blank children', async () => {
    const { container } = render(<ContextProvider></ContextProvider>);
    expect(container.firstChild).toBeNull();
  });
  it('renders content of children', async () => {
    const component = render(
      <ContextProvider>
        <div>xxx</div>
      </ContextProvider>
    );

    expect(component.getByText('xxx')).toBeInTheDocument();
  });
  it('works with submit props', async () => {
    const onSubmitFunction = (text: string) => {
      console.log(text);
      ContextProviderC.addFormContextData('submittedData', { text: text });
    };
    const SubmitComponent = () => {
      const Enumerators = useContext(JsonFormContext) as enumerators;
      const submitFormFunction = Enumerators.submitFunction.get('submit-form');
      const submitForm = submitFormFunction && submitFormFunction();
      submitForm && submitForm('abc');

      return <div></div>;
    };
    render(
      <ContextProvider
        submit={{
          submitForm: onSubmitFunction,
        }}
      >
        <div>
          <SubmitComponent />
        </div>
      </ContextProvider>
    );

    expect(ContextProviderC.getFormContextData('submittedData')).toEqual({ text: 'abc' });
  });

  it('works with data props', async () => {
    const animals = [
      { name: 'Elephant', type: 'Mammal', habitat: 'Land' },
      { name: 'Penguin', type: 'Bird', habitat: 'Ice' },
      { name: 'Kangaroo', type: 'Mammal', habitat: 'Grasslands' },
      { name: 'Giraffe', type: 'Mammal', habitat: 'Savanna' },
      { name: 'Octopus', type: 'Invertebrate', habitat: 'Ocean' },
      { name: 'Cheetah', type: 'Mammal', habitat: 'Grasslands' },
      { name: 'Koala', type: 'Mammal', habitat: 'Eucalyptus Forest' },
      { name: 'Toucan', type: 'Bird', habitat: 'Rainforest' },
      { name: 'Dolphin', type: 'Mammal', habitat: 'Ocean' },
      { name: 'Arctic Fox', type: 'Mammal', habitat: 'Arctic Tundra' },
    ];

    const DataComponent = () => {
      const enumerators = useContext(JsonFormContext);
      const animals = enumerators.data.get('animals');

      return (
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        <div key="0">
          {animals && animals().animals.map((a: { name: string }, index: string) => <div key={index}>{a.name}</div>)}
        </div>
      );
    };
    const component = render(
      <ContextProvider data={[{ animals }]}>
        <div>
          <DataComponent />
        </div>
      </ContextProvider>
    );

    expect(component.getByText('Dolphin')).toBeInTheDocument();
    expect(component.getByText('Kangaroo')).toBeInTheDocument();
    expect(component.getByText('Penguin')).toBeInTheDocument();
  });
});
