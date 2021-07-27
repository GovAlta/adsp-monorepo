import { RedisClient } from 'redis';
import { CodeRepository, VerifyCode } from '../verify';

export class RedisCodeRepository implements CodeRepository {
  constructor(private readonly client: RedisClient) {}

  get(key: string): Promise<VerifyCode> {
    return new Promise((resolve, reject) => {
      this.client.hmget(key, 'code', 'failures', (err, result) => {
        if (err) {
          reject(err);
        } else {
          resolve(
            result
              ? {
                  key,
                  code: result[0],
                  failures: result[1] ? parseInt(result[1]) : 0,
                }
              : null
          );
        }
      });
    });
  }

  set(code: VerifyCode, expiresAt: Date): Promise<VerifyCode> {
    return new Promise((resolve, reject) => {
      this.client.hset(code.key, 'code', code.code, 'failures', '0', (err) => {
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

  failed(key: string, max: number): Promise<boolean> {
    return new Promise<boolean>((resolve) => {
      this.client.hincrby(key, 'failures', 1, (err, result) => {
        if (!err && result === max) {
          this.client.del(key, (err, deleted) => {
            resolve(!err && deleted > 0);
          });
        } else {
          resolve(false);
        }
      });
    });
  }
}
