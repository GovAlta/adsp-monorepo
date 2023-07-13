import { Webhooks, WebhookStatus } from '../models';

export const SAVE_WEBHOOK_ACTION = 'status/SAVE_WEBHOOK';
export const SAVE_WEBHOOK_SUCCESS_ACTION = 'status/SAVE_WEBHOOK_SUCCESS';

export interface saveWebhookAction {
  type: typeof SAVE_WEBHOOK_ACTION;
  payload: Webhooks;
}

export interface SaveWebhookSuccessAction {
  type: typeof SAVE_WEBHOOK_SUCCESS_ACTION;
  payload: Record<string, Webhooks>;
  hookIntervals: Record<string, WebhookStatus>;
}

export const saveWebhook = (payload: Webhooks): saveWebhookAction => ({
  type: 'status/SAVE_WEBHOOK',
  payload,
});

export const SaveWebhookSuccess = (
  payload: Record<string, Webhooks>,
  hookIntervals: Record<string, WebhookStatus>
): SaveWebhookSuccessAction => ({
  type: 'status/SAVE_WEBHOOK_SUCCESS',
  payload,
  hookIntervals,
});
