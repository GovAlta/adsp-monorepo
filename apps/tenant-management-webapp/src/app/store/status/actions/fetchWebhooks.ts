import { Webhooks, WebhookStatus } from '../models';

export const FETCH_WEBHOOK_ACTION = 'status/FETCH_WEBHOOK_ACTION';
export const FETCH_WEBHOOK_SUCCESS_ACTION = 'status/FETCH_WEBHOOK_SUCCESS_ACTION';

export interface FetchWebhooksAction {
  type: typeof FETCH_WEBHOOK_ACTION;
}

export interface FetchWebhooksSuccessAction {
  type: typeof FETCH_WEBHOOK_SUCCESS_ACTION;
  payload: Record<string, Webhooks>;
  hookIntervals: Record<string, WebhookStatus>;
}

export interface FetchWebhookAction {
  type: typeof FETCH_WEBHOOK_ACTION;
}

export const fetchWebhooks = (): FetchWebhooksAction => ({
  type: FETCH_WEBHOOK_ACTION,
});

export const fetchWebhooksSuccess = (
  payload: Record<string, Webhooks>,
  hookIntervals: Record<string, WebhookStatus>
): FetchWebhooksSuccessAction => ({
  type: FETCH_WEBHOOK_SUCCESS_ACTION,
  payload: payload || {},
  hookIntervals: hookIntervals || {},
});
