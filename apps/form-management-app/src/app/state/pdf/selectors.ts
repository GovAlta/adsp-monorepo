import { AppState } from '../store';
import { createSelector } from '@reduxjs/toolkit';

export const checkPdfFileSelector = createSelector(
  (state: AppState) => state.pdf.pdfFileData,
  (pdf) => pdf
);

export const getSocketChannel = createSelector(
  (state: AppState) => state.pdf.socketChannel,
  (pdf) => pdf
);


export const pdfGenerationBusy = (state: AppState) => state.pdf.busy;