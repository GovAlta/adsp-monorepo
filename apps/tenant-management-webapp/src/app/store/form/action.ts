import { FormDefinition, RefDefinition } from './model';

export const FETCH_FORM_DEFINITIONS_ACTION = 'form/FETCH_FORM_DEFINITIONS_ACTION';
export const FETCH_FORM_DEFINITIONS_SUCCESS_ACTION = 'form/FETCH_FORM_DEFINITIONS_SUCCESS_ACTION';
export const FETCH_REF_DEFINITIONS_ACTION = 'form/FETCH_REF_DEFINITIONS_ACTION';
export const FETCH_REF_DEFINITIONS_SUCCESS_ACTION = 'form/FETCH_REF_DEFINITIONS_SUCCESS_ACTION';

export const UPDATE_REF_DEFINITION_ACTION = 'form/UPDATE_REF_DEFINITION_ACTION';
export const UPDATE_REF_DEFINITION_SUCCESS_ACTION = 'form/UPDATE_REF_DEFINITION_SUCCESS_ACTION';
export const UPDATE_FORM_DEFINITION_ACTION = 'form/UPDATE_FORM_DEFINITION_ACTION';
export const UPDATE_FORM_DEFINITION_SUCCESS_ACTION = 'form/UPDATE_FORM_DEFINITION_SUCCESS_ACTION';

export const DELETE_FORM_DEFINITION_ACTION = 'form/DELETE_FORM_DEFINITION_ACTION';
export const DELETE_FORM_DEFINITION_SUCCESS_ACTION = 'form/DELETE_FORM_DEFINITION_SUCCESS_ACTION';
export const DELETE_FORM_BY_ID_ACTION = 'form/DELETE_FORM_BY_ID_ACTION';

export interface FetchFormDefinitionsAction {
  type: typeof FETCH_FORM_DEFINITIONS_ACTION;
}

export interface FetchFormDefinitionsSuccessAction {
  type: typeof FETCH_FORM_DEFINITIONS_SUCCESS_ACTION;
  payload: Record<string, FormDefinition>;
}
export interface FetchRefDefinitionsAction {
  type: typeof FETCH_REF_DEFINITIONS_ACTION;
}

export interface FetchRefDefinitionsSuccessAction {
  type: typeof FETCH_REF_DEFINITIONS_SUCCESS_ACTION;
  payload: Record<string, RefDefinition>;
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

export interface UpdateRefDefinitionsSuccessAction {
  type: typeof UPDATE_REF_DEFINITION_SUCCESS_ACTION;
  payload: Record<string, RefDefinition>;
}

export interface UpdateRefDefinitionsAction {
  type: typeof UPDATE_REF_DEFINITION_ACTION;
  definition: RefDefinition;
  options?: string;
}

export interface DeleteFormDefinitionSuccessAction {
  type: typeof DELETE_FORM_DEFINITION_SUCCESS_ACTION;
  payload: Record<string, FormDefinition>;
}

export interface DeleteFormByIDAction {
  type: typeof DELETE_FORM_BY_ID_ACTION;
  id: string;
}

export type FormActionTypes =
  | FetchFormDefinitionsSuccessAction
  | FetchFormDefinitionsAction
  | FetchRefDefinitionsSuccessAction
  | FetchRefDefinitionsAction
  | DeleteFormDefinitionAction
  | DeleteFormDefinitionSuccessAction
  | UpdateFormDefinitionsAction
  | UpdateRefDefinitionsAction
  | UpdateRefDefinitionsSuccessAction
  | DeleteFormByIDAction
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

export const updateRefDefinition = (definition: RefDefinition, options?: string): UpdateRefDefinitionsAction => ({
  type: UPDATE_REF_DEFINITION_ACTION,
  definition,
  options,
});

export const updateRefDefinitionSuccess = (
  definition: Record<string, RefDefinition>
): UpdateRefDefinitionsSuccessAction => ({
  type: UPDATE_REF_DEFINITION_SUCCESS_ACTION,
  payload: definition,
});

export const getRefDefinitions = (): FetchRefDefinitionsAction => ({
  type: FETCH_REF_DEFINITIONS_ACTION,
});

export const getRefDefinitionsSuccess = (results: Record<string, RefDefinition>): FetchRefDefinitionsSuccessAction => ({
  type: FETCH_REF_DEFINITIONS_SUCCESS_ACTION,
  payload: results,
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

export const deleteFormById = (id: string): DeleteFormByIDAction => ({
  type: DELETE_FORM_BY_ID_ACTION,
  id,
});
