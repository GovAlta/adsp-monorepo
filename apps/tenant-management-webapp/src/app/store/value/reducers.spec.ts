import reducer from './reducers';
import {
  clearValueDefinitionSave,
  createValueDefinition,
  saveValueDefinitionFailed,
  updateValueDefinition,
  updateValueDefinitionSuccess,
} from './actions';
import { defaultValueDefinition, ValueState } from './models';

describe('value reducer definition save state', () => {
  const definition = { ...defaultValueDefinition, namespace: 'test', name: 'response-time' };
  const initialState = reducer(undefined, { type: 'init' } as never);

  it('starts idle', () => {
    expect(initialState.definitionSave).toEqual({ status: 'idle' });
  });

  it('marks create and update as saving', () => {
    expect(reducer(initialState, createValueDefinition(definition)).definitionSave).toEqual({ status: 'saving' });
    expect(reducer(initialState, updateValueDefinition(definition)).definitionSave).toEqual({ status: 'saving' });
  });

  it('marks a successful save as saved and stores the definition', () => {
    const state = reducer({ ...initialState, results: [] }, updateValueDefinitionSuccess(definition));

    expect(state.definitionSave).toEqual({ status: 'saved' });
    expect(state.definitions['test:response-time']).toEqual(definition);
  });

  it('keeps the error of a failed save until it is cleared', () => {
    const failed: ValueState = reducer(initialState, saveValueDefinitionFailed('invalid schema'));
    expect(failed.definitionSave).toEqual({ status: 'failed', error: 'invalid schema' });

    expect(reducer(failed, clearValueDefinitionSave()).definitionSave).toEqual({ status: 'idle' });
  });
});
