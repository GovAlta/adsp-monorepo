import { RootState } from '@store/index';
import { RegisterConfigData } from '@abgov/jsonforms-components';
import { selectNonAnonymousDataList, selectRegisterData, selectRegisterDataList } from './selectors';

const registerUrn = (name: string) => `urn:ads:platform:configuration:v2:/configuration/data-register/${name}`;

const definitions = {
  'platform:countries': { configurationSchema: { type: 'array', items: { type: 'string' } } },
  'platform:public-holidays': {
    anonymousRead: true,
    configurationSchema: { type: 'array', items: { type: 'object' } },
  },
  'data-register:weekdays': {
    configurationSchema: { type: 'array', items: { anyOf: [{ type: 'string' }, { type: 'object' }] } },
  },
  'form-service:settings': { configurationSchema: { type: 'object' } },
};

const weekdays: RegisterConfigData = {
  urn: registerUrn('weekdays'),
  description: 'Days of the week',
  data: ['Monday'],
};

const stateWith = (configuration: Record<string, unknown>, registers: RegisterConfigData[] = []) =>
  ({
    configuration: { tenantConfigDefinitions: { configuration, revision: 1 }, registers },
  }) as unknown as RootState;

describe('configuration selectors', () => {
  describe('selectRegisterData', () => {
    it('returns the registers in state', () => {
      const registers = selectRegisterData(stateWith({}, [weekdays]));

      expect(registers).toEqual([weekdays]);
    });
  });

  describe('selectRegisterDataList', () => {
    it('lists definitions that are arrays of strings or objects the same way the fetch saga used to', () => {
      const dataList = selectRegisterDataList(stateWith(definitions));

      expect(dataList).toEqual(['platform/countries', 'platform/public-holidays']);
    });

    it('adds the loaded data registers whose anyOf schema is not a data list definition', () => {
      const dataList = selectRegisterDataList(stateWith(definitions, [weekdays]));

      expect(dataList).toEqual(['platform/countries', 'platform/public-holidays', 'data-register/weekdays']);
    });

    it('lists a register once when it is also a data list definition', () => {
      const legacyDefinitions = {
        'data-register:weekdays': { configurationSchema: { type: 'array', items: { type: 'string' } } },
      };

      const dataList = selectRegisterDataList(stateWith(legacyDefinitions, [weekdays]));

      expect(dataList).toEqual(['data-register/weekdays']);
    });

    it('lists the loaded registers before the definitions have been fetched', () => {
      const state = { configuration: { registers: [weekdays] } } as unknown as RootState;

      const dataList = selectRegisterDataList(state);

      expect(dataList).toEqual(['data-register/weekdays']);
    });

    it('returns the same list for unchanged state', () => {
      const state = stateWith(definitions, [weekdays]);

      expect(selectRegisterDataList(state)).toBe(selectRegisterDataList(state));
    });
  });

  describe('selectNonAnonymousDataList', () => {
    it('lists data list definitions that are not anonymously readable the same way the fetch saga used to', () => {
      const nonAnonymous = selectNonAnonymousDataList(stateWith(definitions, [weekdays]));

      expect(nonAnonymous).toEqual(['platform/countries']);
    });

    it('returns an empty list before the definitions have been fetched', () => {
      const state = { configuration: { registers: [] } } as unknown as RootState;

      const nonAnonymous = selectNonAnonymousDataList(state);

      expect(nonAnonymous).toEqual([]);
    });
  });
});
