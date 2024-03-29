import { Channel } from '@abgov/adsp-service-sdk';

export const SUBSCRIBER_SEND_VERIFY_CODE = 'send-code';

export interface SendVerifyCodeRequest {
  operation: typeof SUBSCRIBER_SEND_VERIFY_CODE;
  channel: Channel;
  address: string;
  reason?: string;
}

export const SUBSCRIBER_SEND_VERIFY_CODE_WITH_LINK = 'send-code-with-link';
export interface SendVerifyCodeRequestWithLink {
  operation: typeof SUBSCRIBER_SEND_VERIFY_CODE_WITH_LINK;
  channel: Channel;
  address: string;
  reason?: string;
  expireIn?: number;
  verificationLink?: string;
}

export const SUBSCRIBER_CHECK_CODE = 'check-code';
export interface CheckVerifyCodeRequest {
  operation: typeof SUBSCRIBER_CHECK_CODE;
  channel: Channel;
  address: string;
  code: string;
}

export const SUBSCRIBER_VERIFY_CHANNEL = 'verify-channel';
export interface VerifyChannelRequest {
  operation: typeof SUBSCRIBER_VERIFY_CHANNEL;
  channel: Channel;
  address: string;
  code: string;
}

export type SubscriberOperationRequests =
  | SendVerifyCodeRequestWithLink
  | SendVerifyCodeRequest
  | CheckVerifyCodeRequest
  | VerifyChannelRequest;
