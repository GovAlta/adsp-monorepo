import { AppState } from '../store';

export const selectFormDefinitions = (state: AppState) => state.form.definitions;
export const selectFormLoading = (state: AppState) => state.form.loading;
export const savedDefinition = (state: AppState) => state.form.currentDefinition;