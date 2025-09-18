import { Webhooks } from '../models';

export const DELETE_WEBHOOK_ACTION = 'status/DELETE_WEBHOOK';
export const DELETE_WEBHOOK_SUCCESS_ACTION = 'status/DELETE_WEBHOOK_SUCCESS';

export interface DeleteWebhookAction {
  type: typeof DELETE_WEBHOOK_ACTION;
  payload: Webhooks;
}

export interface DeleteWebhookSuccessAction {
  type: typeof DELETE_WEBHOOK_SUCCESS_ACTION;
  payload: string;
}

export const DeleteWebhookService = (payload: Webhooks): DeleteWebhookAction => ({
  type: 'status/DELETE_WEBHOOK',
  payload,
});
export const deleteWebhookSuccess = (payload: string): DeleteWebhookSuccessAction => ({
  type: 'status/DELETE_WEBHOOK_SUCCESS',
  payload,
});
