import { StreamItem } from '../model';

/**
 * Request property that holds the stream entity resolved for the request.
 */
export const STREAM_KEY = 'stream';

export function mapStreamItem(item: StreamItem): Record<string, unknown> {
  const result: Record<string, unknown> = {
    ...item,
  };

  if (result.tenantId) {
    result.tenantId = result.tenantId.toString();
  }

  return result;
}
