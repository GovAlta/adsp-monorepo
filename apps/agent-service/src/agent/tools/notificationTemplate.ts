import { adspId, ServiceDirectory, TokenProvider } from '@abgov/adsp-service-sdk';
import { createTool } from '@mastra/core/tools';
import type { ToolExecutionContext } from '@mastra/core/tools';
import axios, { isAxiosError } from 'axios';
import type { Logger } from 'winston';
import { z } from 'zod';
import { AdspRequestContext } from '../types';

interface NotificationTemplateToolsProps {
  directory: ServiceDirectory;
  tokenProvider: TokenProvider;
  logger: Logger;
}

export async function createNotificationTemplateTools({
  directory,
  tokenProvider,
  logger,
}: NotificationTemplateToolsProps) {
  const configurationServiceUrl = await directory.getServiceUrl(adspId`urn:ads:platform:configuration-service:v2`);

  const notificationTemplateProposalTool = createTool({
    id: 'notification-template-proposal',
    description:
      'Propose and save specific email template content (subject line, title, subtitle, or body HTML). ' +
      'ONLY call this tool when you have concrete template text to propose. ' +
      'NEVER call this tool for: greetings, questions, clarifications, or conversational responses. ' +
      'If the user says "hi" or asks a question, respond with plain text instead. ' +
      'The tool automatically persists the proposed changes to the configuration service.',
    inputSchema: z.object({
      subject: z.string().optional().describe('The proposed email subject line.'),
      title: z.string().optional().describe('The proposed email title (displayed in the GOA header area).'),
      subtitle: z.string().optional().describe('The proposed email subtitle.'),
      body: z.string().optional().describe('The proposed email body HTML content.'),
    }),
    execute: async (input, context: ToolExecutionContext) => {
      const proposal = Object.fromEntries(Object.entries(input).filter(([, v]) => v !== undefined));

      // Attempt to persist the template via configuration-service.
      const requestContext = context.requestContext as AdspRequestContext<{
        notificationTypeId: string;
        notificationType: string;
      }>;
      const tenantId = requestContext.get('tenantId');
      const notificationTypeId = requestContext.get('notificationTypeId') as string | undefined;
      const notificationType = requestContext.get('notificationType') as string | undefined; // "namespace:name"

      if (!notificationTypeId || !notificationType) {
        logger.warn('Cannot save template: missing notificationTypeId or notificationType in context.', {
          context: 'notificationTemplateProposalTool',
          tenant: tenantId?.toString(),
        });
        return { ...proposal, saved: false, reason: 'Missing notification type context for save.' };
      }

      try {
        const configUrl = new URL('v2/configuration/platform/notification-service', configurationServiceUrl);
        const token = await tokenProvider.getAccessToken();
        const headers = { Authorization: `Bearer ${token}` };

        // Fetch current configuration to find the event and merge template changes.
        const { data: configData } = await axios.get(configUrl.href, {
          params: { tenantId: tenantId?.toString() },
          headers,
        });

        const configuration = configData?.latest?.configuration;
        const typeConfig = configuration?.[notificationTypeId];

        if (!typeConfig) {
          logger.warn(`Notification type '${notificationTypeId}' not found in configuration.`, {
            context: 'notificationTemplateProposalTool',
            tenant: tenantId?.toString(),
          });
          return { ...proposal, saved: false, reason: `Notification type '${notificationTypeId}' not found.` };
        }

        // Find the matching event by namespace:name.
        const [namespace, name] = notificationType.split(':');
        const events: Array<Record<string, unknown>> = typeConfig.events || [];
        const eventIndex = events.findIndex((e) => e.namespace === namespace && e.name === name);

        if (eventIndex < 0) {
          logger.warn(`Event '${notificationType}' not found in notification type '${notificationTypeId}'.`, {
            context: 'notificationTemplateProposalTool',
            tenant: tenantId?.toString(),
          });
          return { ...proposal, saved: false, reason: `Event '${notificationType}' not found.` };
        }

        // Merge the proposed fields into the existing email template.
        const event = events[eventIndex];
        const templates = (event.templates || {}) as Record<string, Record<string, unknown>>;
        const emailTemplate = templates.email || {};

        const updatedEmailTemplate = {
          ...emailTemplate,
          ...proposal,
        };

        // Build the updated events array.
        const updatedEvents = [...events];
        updatedEvents[eventIndex] = {
          ...event,
          templates: {
            ...templates,
            email: updatedEmailTemplate,
          },
        };

        // PATCH the configuration.
        const patchUrl = new URL('v2/configuration/platform/notification-service', configurationServiceUrl);
        await axios.patch(
          patchUrl.href,
          {
            operation: 'UPDATE',
            update: {
              [notificationTypeId]: {
                ...typeConfig,
                events: updatedEvents,
              },
            },
          },
          {
            params: { tenantId: tenantId?.toString() },
            headers,
          },
        );

        logger.info(`Saved email template for event '${notificationType}' in type '${notificationTypeId}'.`, {
          context: 'notificationTemplateProposalTool',
          tenant: tenantId?.toString(),
        });

        return { ...proposal, saved: true };
      } catch (err) {
        const message = isAxiosError(err) ? err.response?.data?.message || err.message : (err as Error).message;
        logger.error(`Failed to save notification template: ${message}`, {
          context: 'notificationTemplateProposalTool',
          tenant: tenantId?.toString(),
        });
        return { ...proposal, saved: false, reason: message };
      }
    },
  });

  return { notificationTemplateProposalTool };
}
