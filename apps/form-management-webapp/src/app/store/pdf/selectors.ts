import { RootState } from '@store/index';
import { createSelector } from 'reselect';

export const selectPdfTemplateById = createSelector(
  (state: RootState) => state.pdf?.pdfTemplates,
  (_, id) => id,
  (templates, id) => {
    return templates[id];
  }
);
export const selectCorePdfTemplateById = createSelector(
  (state: RootState) => state.pdf?.corePdfTemplates,
  (_, id) => id,
  (templates, id) => {
    return templates && templates[id];
  }
);
