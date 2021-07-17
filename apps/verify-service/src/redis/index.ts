import { createClient } from 'redis';
import { CodeRepository } from '../verify';
import { RedisCodeRepository } from './repository';

interface RedisProps {
  REDIS_HOST: string;
  REDIS_PORT: number;
  REDIS_PASSWORD: string;
}
export const createRedisRepository = ({
  REDIS_HOST,
  REDIS_PORT,
  REDIS_PASSWORD,
}: RedisProps): CodeRepository => {
  const credentials = REDIS_PASSWORD ? `:${REDIS_PASSWORD}@` : '';
  const client = createClient(`redis://${credentials}${REDIS_HOST}:${REDIS_PORT}/0`);
  return new RedisCodeRepository(client);
};
