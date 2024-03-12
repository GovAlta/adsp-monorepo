import { createSelector } from 'reselect';
import { selectDirectoryByServiceName } from '@store/directory/selectors';
import { RootState } from '@store/index';
import { toKebabName } from '@lib/kebabName';

const PUBLIC_FORM_APP = 'form-app';
export const selectFormAppHost = createSelector(
  (state: RootState) => state,
  (state) => {
    return selectDirectoryByServiceName(state, PUBLIC_FORM_APP)?.url;
  }
);

export const selectDefaultFormUrl = createSelector(
  (state: RootState) => state.tenant,
  selectFormAppHost,
  (_, formId: string | null) => formId,
  (state, appFormHost, formId) => {
    const tenantName = toKebabName(state.name);
    if (formId === null) {
      return `${appFormHost}/${tenantName}/{{formId}}/{{id}}`;
    }
    return `${appFormHost}/${tenantName}/${formId}/{{id}}`;
  }
);
