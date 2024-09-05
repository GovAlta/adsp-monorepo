import { selectDirectoryByServiceName } from '@store/directory/selectors';
import { RootState } from '@store/index';
import { toKebabName } from '@lib/kebabName';
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
    const tenantName = toKebabName(state.name);
    return `${appFormHost}/${tenantName}/${formId}`;
  }
);

export const selectDefaultFormUrl = createSelector(
  (state: RootState) => state.tenant,
  selectFormAppHost,
  (_, formId: string | null) => formId,
  (state, appFormHost, formId) => {
    const tenantName = toKebabName(state.name);
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

export const isFormUpdatedSelector = createSelector(
  (state: RootState) => state.form.editor.original,
  (state: RootState) => state.form.editor.modified,
  (state: RootState) => state.form.editor.dataSchema,
  (state: RootState) => state.form.editor.uiSchema,
  (original, modified, dataSchema, uiSchema) => {
    const originalDigest = JSON.stringify(original);
    const modifiedDigest = JSON.stringify({ ...modified, dataSchema, uiSchema });
    return originalDigest !== modifiedDigest;
  }
);

export const schemaErrorSelector = createSelector(
  (state: RootState) => state.form.editor.dataSchemaError,
  (state: RootState) => state.form.editor.uiSchemaError,
  (dataError, uiError) => dataError || uiError
);
