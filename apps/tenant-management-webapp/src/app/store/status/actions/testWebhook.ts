import { Webhooks } from '../models';

export const TEST_WEBHOOK_ACTION = 'status/Test_WEBHOOK_ACTION';
export const TEST_WEBHOOK_SUCCESS_ACTION = 'status/Test_WEBHOOK_SUCCESS_ACTION';

export interface TestWebhooksAction {
  type: typeof TEST_WEBHOOK_ACTION;
  webhook: Webhooks;
  eventName: string;
}

export interface TestWebhookSuccessAction {
  type: typeof TEST_WEBHOOK_SUCCESS_ACTION;
  payload: Record<string, Webhooks>;
}

export interface TestWebhookAction {
  type: typeof TEST_WEBHOOK_ACTION;
  webhook: Webhooks;
  eventName: string;
}

export const TestWebhooks = (webhook: Webhooks, eventName: string): TestWebhooksAction => ({
  type: TEST_WEBHOOK_ACTION,
  webhook: webhook,
  eventName: eventName,
});

export const TestWebhooksSuccess = (payload: Record<string, Webhooks>): TestWebhookSuccessAction => ({
  type: TEST_WEBHOOK_SUCCESS_ACTION,
  payload,
});
