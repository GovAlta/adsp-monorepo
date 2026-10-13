import { RegisterConfigData } from '@abgov/jsonforms-components';
import reducer from './reducers';
import {
  createDataRegisterSuccessAction,
  deleteDataRegisterSuccessAction,
  getRegisterDataAction,
  getRegisterDataFailedAction,
  getRegisterDataSuccessAction,
  updateDataRegisterSuccessAction,
} from './action';
import { ConfigurationDefinitionState } from './model';

const urnFor = (name: string) => `urn:ads:platform:configuration:v2:/configuration/data-register/${name}`;
const weekdays: RegisterConfigData = { urn: urnFor('weekdays'), description: 'Days of the week', data: ['Monday'] };
const provinces: RegisterConfigData = { urn: urnFor('provinces'), description: 'Provinces', data: ['Alberta'] };

const stateWith = (overrides: Partial<ConfigurationDefinitionState>): ConfigurationDefinitionState =>
  ({ ...reducer(undefined, { type: 'init' } as never), ...overrides }) as ConfigurationDefinitionState;

describe('configuration reducer data registers', () => {
  it('starts with no registers', () => {
    const state = reducer(undefined, { type: 'init' } as never);

    expect(state.registers).toEqual([]);
  });

  it('turns the spinner on when registers are fetched', () => {
    const state = reducer(stateWith({}), getRegisterDataAction());

    expect(state.isFetchingRegisterData).toBe(true);
  });

  it('stores the fetched registers', () => {
    const state = reducer(stateWith({ isFetchingRegisterData: true }), getRegisterDataSuccessAction([weekdays]));

    expect(state.registers).toEqual([weekdays]);
  });

  it('turns the spinner off when the fetch succeeds', () => {
    const state = reducer(stateWith({ isFetchingRegisterData: true }), getRegisterDataSuccessAction([weekdays]));

    expect(state.isFetchingRegisterData).toBe(false);
  });

  it('turns the spinner off when the fetch fails', () => {
    const state = reducer(stateWith({ isFetchingRegisterData: true }), getRegisterDataFailedAction());

    expect(state.isFetchingRegisterData).toBe(false);
  });

  it('keeps the loaded registers when the fetch fails', () => {
    const state = reducer(stateWith({ registers: [weekdays] }), getRegisterDataFailedAction());

    expect(state.registers).toEqual([weekdays]);
  });

  it('adds a created register', () => {
    const state = reducer(stateWith({ registers: [weekdays] }), createDataRegisterSuccessAction(provinces));

    expect(state.registers).toEqual([weekdays, provinces]);
  });

  it('replaces rather than duplicates a created register with the same URN', () => {
    const recreated = { ...weekdays, data: ['Tuesday'] };

    const state = reducer(stateWith({ registers: [weekdays] }), createDataRegisterSuccessAction(recreated));

    expect(state.registers).toEqual([recreated]);
  });

  it('replaces an updated register by URN', () => {
    const updated = { ...weekdays, data: ['Monday', 'Tuesday'] };

    const state = reducer(stateWith({ registers: [weekdays, provinces] }), updateDataRegisterSuccessAction(updated));

    expect(state.registers).toEqual([provinces, updated]);
  });

  it('adds an updated register that was not loaded yet', () => {
    const state = reducer(stateWith({ registers: undefined }), updateDataRegisterSuccessAction(weekdays));

    expect(state.registers).toEqual([weekdays]);
  });

  it('removes a deleted register by URN', () => {
    const state = reducer(
      stateWith({ registers: [weekdays, provinces] }),
      deleteDataRegisterSuccessAction(weekdays.urn),
    );

    expect(state.registers).toEqual([provinces]);
  });

  it('ignores a delete for a register that is not loaded', () => {
    const state = reducer(stateWith({ registers: undefined }), deleteDataRegisterSuccessAction(weekdays.urn));

    expect(state.registers).toEqual([]);
  });
});
