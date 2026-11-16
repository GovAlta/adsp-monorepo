import type { AdspId } from '@abgov/adsp-service-sdk';
import type { SubscriberChannel } from './types';

/** Generates and verifies codes with the verify service. The tenant attributes the verify service audit records. */
export interface VerifyService {
  sendCode(tenantId: AdspId, channel: SubscriberChannel, reason: string): Promise<string>;
  sendCodeWithLink(
    tenantId: AdspId,
    channel: SubscriberChannel,
    reason: string,
    expireIn?: number,
    verificationLink?: string
  ): Promise<string>;
  verifyCode(tenantId: AdspId, channel: SubscriberChannel, code: string): Promise<boolean>;
}
