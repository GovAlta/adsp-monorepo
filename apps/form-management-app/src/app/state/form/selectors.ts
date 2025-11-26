import { AppState } from '../store';
import { createSelector  } from '@reduxjs/toolkit';
import { UISchemaElement } from '@jsonforms/core';

export const selectFormDefinitions = (state: AppState) => state.form.definitions;
export const selectFormLoading = (state: AppState) => state.form.loading;


export const modifiedDefinitionSelector = createSelector(
  (state: AppState) => state.form.editor.modified,
  (state: AppState) => state.form.editor.dataSchema,
  (state: AppState) => state.form.editor.uiSchema,
  (modified, dataSchema, uiSchema) => ({
    ...modified,
    dataSchema: dataSchema as Record<string, unknown>,
    uiSchema: uiSchema as unknown as UISchemaElement,
  })
);

function digestConfiguration(configuration: object): string {
  return JSON.stringify(
    Object.keys(configuration || {})
      .sort()
      .reduce((values, key) => ({ ...values, [key]: configuration[key] }), {})
  );
}

export const isFormUpdatedSelector = createSelector(
  (state: AppState) => state.form.editor.original,
  modifiedDefinitionSelector,
  (original, modified) => {
    const originalDigest = digestConfiguration(original);
    const modifiedDigest = digestConfiguration(modified);
    return originalDigest !== modifiedDigest;
  }
);

export const schemaErrorSelector = createSelector(
  (state: AppState) => state.form.editor.dataSchemaError,
  (state: AppState) => state.form.editor.uiSchemaError,
  (dataError, uiError) => dataError || uiError
);
