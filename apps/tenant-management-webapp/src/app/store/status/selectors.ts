import { createSelector } from 'reselect';
import { RootState } from '../index';
import {
  AddEditStatusWebhookType,
  StatusWebhookHistoryType,
  DeleteStatusWebhookType,
  TestStatusWebhookType,
} from './models';
import { selectModalStateByType } from '@store/session/selectors';
import { ModalState } from '@store/session/models';
import { defaultHook } from './models';
import { initWebhookSearchCriteria } from './models';

const selectWebhookById = (state: RootState, id) => {
  const ws = Object.values(state.serviceStatus?.webhooks || {});
  return ws.find((w) => w?.id === id);
};

export const selectStatusWebhooks = createSelector(
  (state: RootState) => state,
  (status) => {
    return status.serviceStatus?.webhooks;
  }
);

export const selectWebhookInStatus = createSelector(
  (state: RootState) => state,
  selectModalStateByType(AddEditStatusWebhookType),
  (state, modal: ModalState) => {
    if (modal.isOpen && modal.id !== null) return selectWebhookById(state, modal.id);
    if (modal.isOpen) return defaultHook;
    return undefined;
  }
);

export const selectWebhookToDeleteInStatus = createSelector(
  (state: RootState) => state,
  selectModalStateByType(DeleteStatusWebhookType),
  (state, modal: ModalState) => {
    if (modal.isOpen && modal.id !== null) return selectWebhookById(state, modal.id);
    if (modal.isOpen) return defaultHook;
    return undefined;
  }
);

export const selectWebhookToTestInStatus = createSelector(
  (state: RootState) => state,
  selectModalStateByType(TestStatusWebhookType),
  (state, modal: ModalState) => {
    if (modal.isOpen && modal.id !== null) return selectWebhookById(state, modal.id);
    if (modal.isOpen) return defaultHook;
    return undefined;
  }
);

export const selectWebhookInHistory = createSelector(
  (state: RootState) => state,
  selectModalStateByType(StatusWebhookHistoryType),
  (state, modal: ModalState) => {
    if (modal.isOpen && modal.id !== null) {
      return selectWebhookById(state, modal.id);
    }
    return undefined;
  }
);

export const selectInitTestWebhookCriteria = createSelector(
  (state: RootState) => state,
  selectModalStateByType(TestStatusWebhookType),
  (state, modal: ModalState) => {
    if (modal.isOpen && modal.id !== null) {
      return {
        ...initWebhookSearchCriteria,
        correlationId: modal.id,
        top: 1,
      };
    }
    return null;
  }
);

export const selectInitHistoryWebhookCriteria = createSelector(
  (state: RootState) => state,
  selectModalStateByType(StatusWebhookHistoryType),
  (state, modal: ModalState) => {
    if (modal.isOpen && modal.id !== null) {
      return {
        ...initWebhookSearchCriteria,
        correlationId: modal.id,
      };
    }
    return null;
  }
);
