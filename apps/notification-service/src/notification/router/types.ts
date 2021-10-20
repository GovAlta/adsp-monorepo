import { Channel } from '@abgov/adsp-service-sdk';

export const SUBSCRIBER_SEND_VERIFY_CHANNEL = 'send-verify';
export interface SendVerifyChannelRequest {
  operation: typeof SUBSCRIBER_SEND_VERIFY_CHANNEL;
  channel: Channel;
  address: string;
}

export const SUBSCRIBER_VERIFY_CHANNEL = 'verify-channel';
export interface VerifyChannelRequest {
  operation: typeof SUBSCRIBER_VERIFY_CHANNEL;
  channel: Channel;
  address: string;
  code: string;
}

export type SubscriberOperationRequests = SendVerifyChannelRequest | VerifyChannelRequest;
