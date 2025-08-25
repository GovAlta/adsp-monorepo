import { ServiceDirectory, TenantService, TokenProvider } from '@abgov/adsp-service-sdk';
import { DateTime } from 'luxon';
import { createGetEventMetrics } from './event';
import { Logger } from 'winston';
import { MetricsRepository } from '../repository';

export function createCollectMetricsJob(
  logger: Logger,
  directory: ServiceDirectory,
  tenantService: TenantService,
  tokenProvider: TokenProvider,
  repository: MetricsRepository
) {
  const getEventMetrics = createGetEventMetrics(logger, directory, tokenProvider);

  return async (): Promise<void> => {
    const interval = DateTime.now().minus({ days: 1 }).toUTC().startOf('day');

    const tenants = await tenantService.getTenants();
    let eventCount = 0,
      pdfGenerated = 0,
      logins = 0,
      registrations = 0;
    for (const tenant of tenants) {
      // Logins
      const { count: tenantLogins } = (await getEventMetrics(tenant, 'access-service:LOGIN:count', interval)) || {};
      logins += tenantLogins ?? 0;

      // Registrations
      const { count: tenantRegister } =
        (await getEventMetrics(tenant, 'access-service:REGISTER:count', interval)) || {};
      registrations += tenantRegister ?? 0;

      // Total events
      const { count: tenantEventCount } = (await getEventMetrics(tenant, 'total:count', interval)) || {};
      eventCount += tenantEventCount ?? 0;

      // PDFs Generated
      const { count: tenantPdfGenerated } =
        (await getEventMetrics(tenant, 'pdf-service:pdf-generated:count', interval)) || {};
      pdfGenerated += tenantPdfGenerated ?? 0;
    }
    const metrics = { eventCount, pdfGenerated, logins, registrations };
    await repository.writeMetrics(interval.toISO(), metrics);

    logger.info(`Collected metrics for ${interval.toISODate()}: ${JSON.stringify(metrics)}`, {
      context: 'collectMetricsJob',
    });
  };
}
