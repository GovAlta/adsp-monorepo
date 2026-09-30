import {
  createValueDefinition,
  CREATE_VALUE_DEFINITION_ACTION,
  deleteValueDefinition,
  DELETE_VALUE_DEFINITION_ACTION,
  updateValueDefinition,
  updateValueDefinitionSuccess,
  UPDATE_VALUE_DEFINITION_ACTION,
  UPDATE_VALUE_DEFINITION_SUCCESS_ACTION,
} from './actions';
import { defaultValueDefinition } from './models';

describe('value definition actions', () => {
  const definition = { ...defaultValueDefinition, namespace: 'test', name: 'response-time' };

  it('creates the create definition action', () => {
    expect(createValueDefinition(definition)).toEqual({ type: CREATE_VALUE_DEFINITION_ACTION, definition });
  });

  it('creates the update definition actions', () => {
    expect(updateValueDefinition(definition)).toEqual({ type: UPDATE_VALUE_DEFINITION_ACTION, definition });
    expect(updateValueDefinitionSuccess(definition)).toEqual({
      type: UPDATE_VALUE_DEFINITION_SUCCESS_ACTION,
      definition,
    });
  });

  it('creates the delete definition action', () => {
    expect(deleteValueDefinition(definition)).toEqual({ type: DELETE_VALUE_DEFINITION_ACTION, definition });
  });
});
