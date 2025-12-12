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
export const selectPrograms = (state: AppState) => state.form.programs;
export const selectMinistries = (state: AppState) => state.form.ministries;
export const selectFormPage = (state: AppState) => state.form.page;
export const selectFormNext = (state: AppState) => state.form.next;
export const selectFormCursors = (state: AppState) => state.form.cursors;
export const selectFormCriteria = (state: AppState) => state.form.criteria;
