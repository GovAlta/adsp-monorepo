import { AdspId } from '@abgov/adsp-service-sdk';
import { FileResult, JobState } from './types';

export function mapJob(serviceId: AdspId, { id, status, result }: JobState<FileResult>) {
  return {
    urn: `${serviceId}:v1:/jobs/${id}`,
    id,
    status,
    result: result ? { urn: result.urn, id: result.id, filename: result.filename } : null,
  };
}
