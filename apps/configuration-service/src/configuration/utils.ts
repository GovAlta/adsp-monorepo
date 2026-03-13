import { Logger } from 'winston';

export function calculateConfigurationSize(
  logger: Logger,
  namespace: string,
  name: string,
  configuration: unknown
): number | undefined {
  try {
    return Buffer.byteLength(JSON.stringify(configuration || {}), 'utf8');
  } catch (err) {
    logger.debug(`Failed to calculate configuration size for ${namespace}:${name}: ${err.message}`);
    return undefined;
  }
}