import { RootState } from '@store/index';
import { createSelector } from 'reselect';

export const selectPdfTemplateById = createSelector(
  (state: RootState) => state.pdf?.pdfTemplates,
  (_, id) => id,
  (templates, id) => {
    return templates[id];
  }
);
