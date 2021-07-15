import { VerifyCode } from './types';

export interface CodeRepository {
  get(key: string): Promise<VerifyCode>;
  set(code: VerifyCode, expiresAt: Date): Promise<VerifyCode>;
}
