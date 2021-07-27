import { VerifyCode } from './types';

export interface CodeRepository {
  get(key: string): Promise<VerifyCode>;
  set(code: VerifyCode, expiresAt: Date): Promise<VerifyCode>;
  failed(key: string, max: number): Promise<boolean>;
}
