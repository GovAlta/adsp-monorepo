import { ServiceDirectory, TenantService, TokenProvider } from '@abgov/adsp-service-sdk';
import { DateTime } from 'luxon';
import { createGetEventMetrics } from './event';
import { Logger } from 'winston';
import { MetricsRepository } from '../repository';
import { createGetServiceMetrics } from './service';

export function createCollectMetricsJob(
  logger: Logger,
  directory: ServiceDirectory,
  tenantService: TenantService,
  tokenProvider: TokenProvider,
  repository: MetricsRepository
) {
  const getEventMetrics = createGetEventMetrics(logger, directory, tokenProvider);
  const getServiceMetrics = createGetServiceMetrics(logger, directory, tokenProvider);

  return async (): Promise<void> => {
    const interval = DateTime.now().minus({ days: 1 }).toUTC().startOf('day');

    const tenants = await tenantService.getTenants();
    const tenantMetrics = [];
    let eventCount = 0,
      pdfGenerated = 0,
      logins = 0,
      registrations = 0,
      notificationsSent = 0,
      feedbackReceived = 0;
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

      // PDFs generated
      const { count: tenantPdfGenerated } =
        (await getEventMetrics(tenant, 'pdf-service:pdf-generated:count', interval)) || {};
      pdfGenerated += tenantPdfGenerated ?? 0;

      // Notifications sent
      const { count: tenantNotificationsSent } =
        (await getEventMetrics(tenant, 'notification-service:notification-sent:count', interval)) || {};
      notificationsSent += tenantNotificationsSent ?? 0;

      // Feedback received
      const { count: tenantFeedbackReceived } =
        (await getServiceMetrics(tenant, 'feedback-service', 'POST:/feedback/v1/feedback', interval)) || {};
      feedbackReceived += tenantFeedbackReceived ?? 0;

      tenantMetrics.push({
        id: tenant.id.resource,
        name: tenant.name,
        logins: tenantLogins,
        registrations: tenantRegister,
        eventCount: tenantEventCount,
        pdfGenerated: tenantPdfGenerated,
        notificationsSent: tenantNotificationsSent,
        feedbackSent: tenantFeedbackReceived,
      });
    }
    const metrics = {
      tenants: tenantMetrics,
      eventCount,
      pdfGenerated,
      logins,
      registrations,
      notificationsSent,
      feedbackReceived,
    };
    await repository.writeMetrics(interval.toISO(), metrics);

    logger.info(`Collected metrics for ${interval.toISODate()}: ${JSON.stringify(metrics)}`, {
      context: 'collectMetricsJob',
    });
  };
}
