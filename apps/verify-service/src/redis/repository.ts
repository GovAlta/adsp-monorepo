import { RedisClient } from 'redis';
import { CodeRepository, VerifyCode } from '../verify';

export class RedisCodeRepository implements CodeRepository {
  constructor(private readonly client: RedisClient) {}

  get(key: string): Promise<VerifyCode> {
    return new Promise((resolve, reject) => {
      this.client.get(key, (err, reply) => {
        if (err) {
          reject(err);
        } else {
          resolve(
            reply
              ? {
                  key,
                  code: reply,
                }
              : null
          );
        }
      });
    });
  }

  set(code: VerifyCode, expiresAt: Date): Promise<VerifyCode> {
    return new Promise((resolve, reject) => {
      this.client.set(code.key, code.code, (err) => {
        if (err) {
          reject(err);
        } else {
          const expiresTimestamp = Math.trunc(expiresAt.getTime() / 1000);
          this.client.expireat(code.key, expiresTimestamp);
          resolve(code);
        }
      });
    });
  }
}
