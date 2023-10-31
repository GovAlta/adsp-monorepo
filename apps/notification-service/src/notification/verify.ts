import type { SubscriberChannel } from './types';

export interface VerifyService {
  sendCode(channel: SubscriberChannel, reason: string, realm: string): Promise<string>;
  verifyCode(channel: SubscriberChannel, code: string): Promise<boolean>;
}
