
import {  createSelector } from '@reduxjs/toolkit';
import { AppState } from '../store';
import { fileSlice } from './file.slice';

export const metaDataSelector = (state: AppState) => state.file.metadata;

export const fileMetadataSelector = createSelector(
  (state: AppState) => state.file.metadata,
  (_state: AppState, urn: string) => urn,
  (metadata, urn) => metadata[urn]
);

export const fileDataUrlSelector = createSelector(
  (state: AppState) => state.file.files,
  (_state: AppState, urn: string) => urn,
  (files, urn) => files[urn]
);
export const checkExistingPdfFile = createSelector(
  (state: AppState) => state.file.pdfFileExists,
  (file) => file
);

export const fileMetaDataSelector = (state: AppState) => state.file.metadata;
export const fileBusySelector = (state: AppState) => state.file.busy;

export const fileLoadingSelector = createSelector(
  (state: AppState) => state.file.busy,
  (_state: AppState, urn: string) => urn,
  (busy, urn) => busy.metadata[urn] || busy.download[urn]
);