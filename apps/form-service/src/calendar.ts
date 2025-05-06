import { adspId, LimitToOne, ServiceDirectory, TokenProvider } from '@abgov/adsp-service-sdk';
import axios, { isAxiosError } from 'axios';
import * as NodeCache from 'node-cache';
import { Logger } from 'winston';
import { CalendarService, FormDefinitionEntity, Intake } from './form';

type IntakeResponse = Omit<Intake, 'isUpcoming' | 'start' | 'end'> & { start: string; end?: string };

class CalendarServiceImpl implements CalendarService {
  private configurationApiId = adspId`urn:ads:platform:configuration-service:v2`;
  constructor(
    private logger: Logger,
    private tokenProvider: TokenProvider,
    private calendarApiUrl: URL,
    private calendar: string,
    private calendarEventCache: NodeCache
  ) {}

  @LimitToOne(
    (propertyKey: string, definition: FormDefinitionEntity) =>
      `${propertyKey}-${definition.tenantId.resource}-${definition.id}`
  )
  async getScheduledIntake(definition: FormDefinitionEntity): Promise<Intake> {
    try {
      this.logger.debug(`Retrieving scheduled intake for definition ${definition.id}...`, {
        context: 'CalendarService',
        tenantId: definition.tenantId.toString(),
      });

      let intake = this.calendarEventCache.get<Intake>(`${definition.tenantId.resource}-${definition.id}`);

      if (intake === undefined) {
        const recordId = this.getRecordId(definition);
        const requestUrl = new URL(`calendar/v1/calendars/${this.calendar}/events`, this.calendarApiUrl);
        let token = await this.tokenProvider.getAccessToken();

        const {
          data: { results: activeResults },
        } = await axios.get<{ results: IntakeResponse[] }>(requestUrl.href, {
          headers: { Authorization: `Bearer ${token}` },
          params: {
            top: 1,
            criteria: JSON.stringify({
              recordId,
              activeOn: new Date().toISOString(),
              orderBy: 'start',
            }),
            tenantId: definition.tenantId.toString(),
          },
        });

        if (activeResults[0]) {
          intake = this.mapIntake(activeResults[0], false);
        } else {
          this.logger.debug(`Retrieving upcoming scheduled intake for definition ${definition.id}...`, {
            context: 'CalendarService',
            tenantId: definition.tenantId.toString(),
          });

          token = await this.tokenProvider.getAccessToken();
          const {
            data: { results: upcomingResults },
          } = await axios.get<{ results: IntakeResponse[] }>(requestUrl.href, {
            headers: { Authorization: `Bearer ${token}` },
            params: {
              top: 1,
              criteria: JSON.stringify({
                recordId,
                startsAfter: new Date().toISOString(),
                orderBy: 'start',
              }),
              tenantId: definition.tenantId.toString(),
            },
          });

          if (upcomingResults[0]) {
            intake = this.mapIntake(upcomingResults[0], true);
          }
        }

        this.calendarEventCache.set<Intake>(`${definition.tenantId.resource}-${definition.id}`, intake || null);

        this.logger.info(
          `Retrieved scheduled intake for definition ${definition.id} (${recordId}) with result ${
            intake ? `${intake.start} to ${intake.end} (upcoming: ${intake.isUpcoming})` : 'none'
          }.`,
          {
            context: 'CalendarService',
            tenantId: definition.tenantId.toString(),
          }
        );
      }
      return intake;
    } catch (err) {
      this.logger.error(
        `Error encountered retrieving scheduled intake for definition ${definition.id}: ${
          isAxiosError(err) ? err.response?.data?.errorMessage || err.message : err
        }`,
        {
          context: 'CalendarService',
          tenantId: definition.tenantId.toString(),
        }
      );
      return;
    }
  }

  private getRecordId(definition: FormDefinitionEntity): string {
    return `${this.configurationApiId}:/configuration/form-service/${definition.id}`;
  }

  private mapIntake(response: IntakeResponse, isUpcoming: boolean): Intake {
    return {
      urn: response.urn,
      name: response.name,
      description: response.description,
      start: new Date(response.start),
      end: response.end && new Date(response.end),
      isAllDay: response.isAllDay,
      isUpcoming,
    };
  }
}

export async function createCalendarService(
  logger: Logger,
  directory: ServiceDirectory,
  tokenProvider: TokenProvider,
  calendar: string,
  calendarEventCache = new NodeCache({ stdTTL: 30, useClones: false })
) {
  const calendarApiUrl = await directory.getServiceUrl(adspId`urn:ads:platform:calendar-service:v1`);
  return new CalendarServiceImpl(logger, tokenProvider, calendarApiUrl, calendar, calendarEventCache);
}
