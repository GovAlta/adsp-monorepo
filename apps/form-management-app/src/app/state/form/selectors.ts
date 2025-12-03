import { AppState } from '../store';

export const selectFormDefinitions = (state: AppState) => state.form.definitions;
export const selectFormLoading = (state: AppState) => state.form.loading;
export const savedDefinition = (state: AppState) => state.form.currentDefinition;
export const filesSelector = (state: AppState) => state.form.files;
export const selectCurrentDefinition = (state: AppState) => state.form.currentDefinition;
export const selectFormBusy = (state: AppState) => state.form.busy;
export const selectIsCreatingDefinition = (state: AppState) => state.form.busy.creating;
export const selectIsSavingDefinition = (state: AppState) => state.form.busy.saving;
export const selectIsDeletingDefinition = (state: AppState) => state.form.busy.deleting;
