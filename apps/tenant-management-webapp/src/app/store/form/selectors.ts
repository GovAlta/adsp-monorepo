import { selectDirectoryByServiceName } from '@store/directory/selectors';
import { RootState } from '@store/index';
import { replaceSpaceWithDash } from '@lib/kebabName';
import { createSelector } from 'reselect';

const PUBLIC_FORM_APP = 'form-app';
export const selectFormAppHost = createSelector(
  (state: RootState) => state,
  (state) => {
    return selectDirectoryByServiceName(state, PUBLIC_FORM_APP)?.url;
  }
);
export const selectFormAppLink = createSelector(
  (state: RootState) => state.tenant,
  selectFormAppHost,
  (_, formId: string | null) => formId,
  (state, appFormHost, formId) => {
    const tenantName = replaceSpaceWithDash(state.name);
    return `${appFormHost}/${tenantName}/${formId}`;
  }
);

export const selectFormResourceTags = createSelector(
  (state: RootState) => state.form,
  (_, formDefinitionId: string) => formDefinitionId,
  (state, formDefinitionId) => {
    return state.definitions[formDefinitionId]?.resourceTags;
  }
);

export const selectDefaultFormUrl = createSelector(
  (state: RootState) => state.tenant,
  selectFormAppHost,
  (_, formId: string | null) => formId,
  (state, appFormHost, formId) => {
    const tenantName = replaceSpaceWithDash(state.name);
    if (formId === null) {
      return `${appFormHost}/${tenantName}/{{formId}}`;
    }
    return `${appFormHost}/${tenantName}/${formId}`;
  }
);

export const modifiedDefinitionSelector = createSelector(
  (state: RootState) => state.form.editor.modified,
  (state: RootState) => state.form.editor.dataSchema,
  (state: RootState) => state.form.editor.uiSchema,
  (modified, dataSchema, uiSchema) => ({
    ...modified,
    dataSchema: dataSchema as Record<string, unknown>,
    uiSchema: uiSchema as unknown as Record<string, unknown>,
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
  (state: RootState) => state.form.editor.original,
  modifiedDefinitionSelector,
  (original, modified) => {
    const originalDigest = digestConfiguration(original);
    const modifiedDigest = digestConfiguration(modified);
    return originalDigest !== modifiedDigest;
  }
);

export const schemaErrorSelector = createSelector(
  (state: RootState) => state.form.editor.dataSchemaError,
  (state: RootState) => state.form.editor.uiSchemaError,
  (dataError, uiError) => dataError || uiError
);
