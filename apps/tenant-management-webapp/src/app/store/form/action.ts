import { FormDefinition } from './model';

export const FETCH_FORM_DEFINITIONS_ACTION = 'pdf/FETCH_FORM_DEFINITIONS_ACTION';
export const FETCH_FORM_DEFINITIONS_SUCCESS_ACTION = 'pdf/FETCH_FORM_DEFINITIONS_SUCCESS_ACTION';

export const UPDATE_FORM_DEFINITION_ACTION = 'pdf/UPDATE_FORM_DEFINITION_ACTION';
export const UPDATE_FORM_DEFINITION_SUCCESS_ACTION = 'pdf/UPDATE_FORM_DEFINITION_SUCCESS_ACTION';

export const DELETE_FORM_DEFINITION_ACTION = 'pdf/DELETE_FORM_DEFINITION_ACTION';
export const DELETE_FORM_DEFINITION_SUCCESS_ACTION = 'pdf/DELETE_FORM_DEFINITION_SUCCESS_ACTION';

export interface FetchFormDefinitionsAction {
  type: typeof FETCH_FORM_DEFINITIONS_ACTION;
}

export interface FetchFormDefinitionsSuccessAction {
  type: typeof FETCH_FORM_DEFINITIONS_SUCCESS_ACTION;
  payload: Record<string, FormDefinition>;
}

export interface UpdateFormDefinitionsAction {
  type: typeof UPDATE_FORM_DEFINITION_ACTION;
  definition: FormDefinition;
  options?: string;
}

export interface UpdateFormDefinitionsSuccessAction {
  type: typeof UPDATE_FORM_DEFINITION_SUCCESS_ACTION;
  payload: Record<string, FormDefinition>;
}

export interface DeleteFormDefinitionAction {
  type: typeof DELETE_FORM_DEFINITION_ACTION;
  definition: FormDefinition;
}

export interface DeleteFormDefinitionSuccessAction {
  type: typeof DELETE_FORM_DEFINITION_SUCCESS_ACTION;
  payload: Record<string, FormDefinition>;
}

export type FormActionTypes =
  | FetchFormDefinitionsSuccessAction
  | FetchFormDefinitionsAction
  | DeleteFormDefinitionAction
  | DeleteFormDefinitionSuccessAction
  | UpdateFormDefinitionsAction
  | UpdateFormDefinitionsSuccessAction;

export const updateFormDefinition = (definition: FormDefinition, options?: string): UpdateFormDefinitionsAction => ({
  type: UPDATE_FORM_DEFINITION_ACTION,
  definition,
  options,
});

export const updateFormDefinitionSuccess = (
  definition: Record<string, FormDefinition>
): UpdateFormDefinitionsSuccessAction => ({
  type: UPDATE_FORM_DEFINITION_SUCCESS_ACTION,
  payload: definition,
});

export const deleteFormDefinition = (definition: FormDefinition): DeleteFormDefinitionAction => ({
  type: DELETE_FORM_DEFINITION_ACTION,
  definition,
});

export const deleteFormDefinitionSuccess = (
  definitions: Record<string, FormDefinition>
): DeleteFormDefinitionSuccessAction => ({
  type: DELETE_FORM_DEFINITION_SUCCESS_ACTION,
  payload: definitions,
});

export const getFormDefinitions = (): FetchFormDefinitionsAction => ({
  type: FETCH_FORM_DEFINITIONS_ACTION,
});

export const getFormDefinitionsSuccess = (
  results: Record<string, FormDefinition>
): FetchFormDefinitionsSuccessAction => ({
  type: FETCH_FORM_DEFINITIONS_SUCCESS_ACTION,
  payload: results,
});
