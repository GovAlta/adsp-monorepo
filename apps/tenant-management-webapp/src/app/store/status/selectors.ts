import { createSelector } from 'reselect';
import { RootState } from '../index';
import { AddEditStatusWebhookType } from './models';
import { selectModalStateByType } from '@store/session/selectors';
import { ModalState } from '@store/session/models';
import { defaultHook } from './models';

const selectWebhookById = (state: RootState, id) => {
  const ws = Object.values(state.serviceStatus?.webhooks || {});
  return ws.find((w) => w?.id === id);
};

export const selectWebhookInStatus = createSelector(
  (state: RootState) => state,
  selectModalStateByType(AddEditStatusWebhookType),
  (state, modal: ModalState) => {
    if (modal.isOpen && modal.id !== null) return selectWebhookById(state, modal.id);
    if (modal.isOpen) return defaultHook;
    return undefined;
  }
);
