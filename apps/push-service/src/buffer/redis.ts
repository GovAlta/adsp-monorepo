import type { RedisClient } from 'redis';

/**
 * Minimal promise based command interface over the (callback based) redis v3 client.
 *
 * Stream commands are sent as raw commands so the buffer doesn't depend on client typings for XADD / XREAD etc.
 */
export interface RedisCommands {
  call(command: string, ...args: (string | number)[]): Promise<unknown>;
  duplicate(): RedisCommands;
  quit(): Promise<void>;
}

export function wrapRedisClient(client: RedisClient): RedisCommands {
  return {
    call: (command, ...args) =>
      new Promise((resolve, reject) =>
        client.send_command(command, args, (err, result) => (err ? reject(err) : resolve(result))),
      ),
    duplicate: () => wrapRedisClient(client.duplicate()),
    quit: () => new Promise((resolve) => client.quit(() => resolve())),
  };
}
