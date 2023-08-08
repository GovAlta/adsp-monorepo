import { FormDefinition } from './model';

export const FETCH_FORM_DEFINITIONS_ACTION = 'form/FETCH_FORM_DEFINITIONS_ACTION';
export const FETCH_FORM_DEFINITIONS_SUCCESS_ACTION = 'form/FETCH_FORM_DEFINITIONS_SUCCESS_ACTION';

export const UPDATE_FORM_DEFINITION_ACTION = 'form/UPDATE_FORM_DEFINITION_ACTION';
export const UPDATE_FORM_DEFINITION_SUCCESS_ACTION = 'form/UPDATE_FORM_DEFINITION_SUCCESS_ACTION';

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

export type FormActionTypes =
  | FetchFormDefinitionsSuccessAction
  | FetchFormDefinitionsAction
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

export const getFormDefinitions = (): FetchFormDefinitionsAction => ({
  type: FETCH_FORM_DEFINITIONS_ACTION,
});

export const getFormDefinitionsSuccess = (
  results: Record<string, FormDefinition>
): FetchFormDefinitionsSuccessAction => ({
  type: FETCH_FORM_DEFINITIONS_SUCCESS_ACTION,
  payload: results,
});
