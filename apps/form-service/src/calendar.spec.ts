import { adspId } from '@abgov/adsp-service-sdk';
import { ValidationService } from '@core-services/core-common';
import axios from 'axios';
import * as NodeCache from 'node-cache';
import { Logger } from 'winston';
import { createCalendarService } from './calendar';
import { FormDefinitionEntity, INTAKE_CALENDAR_NAME } from './form';

jest.mock('axios');
const axiosMock = axios as jest.Mocked<typeof axios>;

describe('calendar', () => {
  const tenantId = adspId`urn:ads:platform:tenant-service:v2:/tenants/test`;
  const definitionId = 'test-definition-id';
  const loggerMock = {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  } as unknown as Logger;

  const tokenProviderMock = {
    getAccessToken: jest.fn(() => Promise.resolve('token')),
  };

  const directoryMock = {
    getServiceUrl: jest.fn(() => Promise.resolve(new URL('https://calendar-service/calendar/v1'))),
    getResourceUrl: jest.fn(),
  };

  const validationService: ValidationService = {
    validate: jest.fn(),
    setSchema: jest.fn(),
  };

  const calendarService = {
    getScheduledIntake: jest.fn(),
    updateScheduleIntake: jest.fn(),
  };

  const cacheMock = {
    set: jest.fn(),
    get: jest.fn(),
  };

  const definition = new FormDefinitionEntity(validationService, calendarService, tenantId, {
    id: 'test',
    name: 'test-form-definition',
    description: null,
    formDraftUrlTemplate: 'https://my-form/{{ id }}',
    anonymousApply: false,
    applicantRoles: ['test-applicant'],
    assessorRoles: ['test-assessor'],
    submissionRecords: false,
    submissionPdfTemplate: '',
    supportTopic: true,
    clerkRoles: [],
    dataSchema: null,
    dispositionStates: [{ id: 'rejectedStatus', name: 'rejected', description: 'err' }],
    queueTaskToProcess: { queueName: 'test', queueNameSpace: 'queue-namespace' },
  });

  beforeEach(() => {
    directoryMock.getServiceUrl.mockClear();
    directoryMock.getResourceUrl.mockClear();
    axiosMock.get.mockReset();
    axiosMock.patch.mockReset();
    axiosMock.isAxiosError.mockReset();
    cacheMock.get.mockReset();
    cacheMock.set.mockReset();
  });

  it('can create service', () => {
    const service = createCalendarService(
      loggerMock,
      directoryMock,
      tokenProviderMock,
      INTAKE_CALENDAR_NAME,
      cacheMock as unknown as NodeCache,
    );
    expect(service).toBeTruthy();
  });

  it('resolves the calendar service url from the directory', async () => {
    // Arrange
    directoryMock.getServiceUrl.mockClear();

    // Act
    await createCalendarService(
      loggerMock,
      directoryMock,
      tokenProviderMock,
      INTAKE_CALENDAR_NAME,
      cacheMock as unknown as NodeCache,
    );

    // Assert
    expect(directoryMock.getServiceUrl).toHaveBeenCalledTimes(1);
    const calls = directoryMock.getServiceUrl.mock.calls as unknown as unknown[][];
    expect(String(calls[0][0])).toBe(adspId`urn:ads:platform:calendar-service:v1`.toString());
  });

  describe('CalendarService', () => {
    describe('getScheduledIntake', () => {
      it('can get active intake', async () => {
        const service = await createCalendarService(
          loggerMock,
          directoryMock,
          tokenProviderMock,
          INTAKE_CALENDAR_NAME,
          cacheMock as unknown as NodeCache,
        );

        axiosMock.get.mockResolvedValueOnce({
          data: { results: [{ name: 'Test', start: new Date().toISOString(), end: new Date().toISOString() }] },
        });
        const intake = await service.getScheduledIntake(definition);
        expect(intake.name).toBe('Test');
        expect(intake.isUpcoming).toBe(false);
        expect(intake.start).toEqual(expect.any(Date));
        expect(intake.end).toEqual(expect.any(Date));
      });

      it('can get upcoming intake', async () => {
        const service = await createCalendarService(
          loggerMock,
          directoryMock,
          tokenProviderMock,
          INTAKE_CALENDAR_NAME,
          cacheMock as unknown as NodeCache,
        );

        axiosMock.get.mockResolvedValueOnce({ data: { results: [] } }).mockResolvedValueOnce({
          data: { results: [{ name: 'Test', start: new Date().toISOString(), end: new Date().toISOString() }] },
        });
        const intake = await service.getScheduledIntake(definition);
        expect(intake.name).toBe('Test');
        expect(intake.isUpcoming).toBe(true);
        expect(intake.start).toEqual(expect.any(Date));
        expect(intake.end).toEqual(expect.any(Date));
      });

      it('can get intake with no result', async () => {
        const service = await createCalendarService(
          loggerMock,
          directoryMock,
          tokenProviderMock,
          INTAKE_CALENDAR_NAME,
          cacheMock as unknown as NodeCache,
        );

        axiosMock.get.mockResolvedValueOnce({ data: { results: [] } }).mockResolvedValueOnce({
          data: { results: [] },
        });
        const intake = await service.getScheduledIntake(definition);
        expect(intake).toBeUndefined();
      });

      it('can return no intake on error', async () => {
        const service = await createCalendarService(
          loggerMock,
          directoryMock,
          tokenProviderMock,
          INTAKE_CALENDAR_NAME,
          cacheMock as unknown as NodeCache,
        );

        axiosMock.get.mockRejectedValueOnce(new Error('oh noes!'));
        const intake = await service.getScheduledIntake(definition);
        expect(intake).toBeUndefined();
      });

      it('can return no intake on axios error', async () => {
        const service = await createCalendarService(
          loggerMock,
          directoryMock,
          tokenProviderMock,
          INTAKE_CALENDAR_NAME,
          cacheMock as unknown as NodeCache,
        );

        const error = new Error('oh noes!');
        error['response'] = { data: { errorMessage: 'Something went wrong!' } };
        axiosMock.get.mockRejectedValueOnce(error);
        axiosMock.isAxiosError.mockReturnValueOnce(true);

        const intake = await service.getScheduledIntake(definition);
        expect(intake).toBeUndefined();
      });

      it('can return no intake on axios error with no data', async () => {
        const service = await createCalendarService(
          loggerMock,
          directoryMock,
          tokenProviderMock,
          INTAKE_CALENDAR_NAME,
          cacheMock as unknown as NodeCache,
        );

        const error = new Error('oh noes!');
        error['response'] = {};
        axiosMock.get.mockRejectedValueOnce(error);
        axiosMock.isAxiosError.mockReturnValueOnce(true);

        const intake = await service.getScheduledIntake(definition);
        expect(intake).toBeUndefined();
      });
      it('maps all intake fields from the calendar event response', async () => {
        // Arrange
        const service = await createCalendarService(
          loggerMock,
          directoryMock,
          tokenProviderMock,
          INTAKE_CALENDAR_NAME,
          cacheMock as unknown as NodeCache,
        );
        const start = new Date().toISOString();
        const end = new Date().toISOString();
        axiosMock.get.mockResolvedValueOnce({
          data: {
            results: [
              {
                urn: 'urn:ads:platform:calendar-service:v1:/calendars/form-intake/events/123',
                name: 'Test',
                description: 'Intake window for test form',
                start,
                end,
                isAllDay: false,
              },
            ],
          },
        });

        // Act
        const intake = await service.getScheduledIntake(definition);

        // Assert
        expect(intake.urn).toBe('urn:ads:platform:calendar-service:v1:/calendars/form-intake/events/123');
        expect(intake.description).toBe('Intake window for test form');
        expect(intake.isAllDay).toBe(false);
      });

      it('maps intake with undefined end when response has no end date', async () => {
        // Arrange
        const service = await createCalendarService(
          loggerMock,
          directoryMock,
          tokenProviderMock,
          INTAKE_CALENDAR_NAME,
          cacheMock as unknown as NodeCache,
        );
        axiosMock.get.mockResolvedValueOnce({
          data: { results: [{ name: 'Test', start: new Date().toISOString(), end: null }] },
        });

        // Act
        const intake = await service.getScheduledIntake(definition);

        // Assert
        expect(intake.end).toBeFalsy();
      });

      it('returns the cached intake without calling the calendar service', async () => {
        // Arrange
        const service = await createCalendarService(
          loggerMock,
          directoryMock,
          tokenProviderMock,
          INTAKE_CALENDAR_NAME,
          cacheMock as unknown as NodeCache,
        );
        const cachedIntake = {
          name: 'Cached intake',
          start: new Date(),
          end: new Date(),
          isUpcoming: false,
        };
        cacheMock.get.mockReturnValueOnce(cachedIntake);

        // Act
        const intake = await service.getScheduledIntake(definition);

        // Assert
        expect(intake).toBe(cachedIntake);
        expect(axiosMock.get).not.toHaveBeenCalled();
      });

      it('returns undefined without calling the calendar service when no intake was previously cached', async () => {
        // Arrange
        const service = await createCalendarService(
          loggerMock,
          directoryMock,
          tokenProviderMock,
          INTAKE_CALENDAR_NAME,
          cacheMock as unknown as NodeCache,
        );
        cacheMock.get.mockReturnValueOnce(null);

        // Act
        const intake = await service.getScheduledIntake(definition);

        // Assert
        expect(intake).toBeNull();
        expect(axiosMock.get).not.toHaveBeenCalled();
      });

      it('caches the resolved intake after a calendar service lookup', async () => {
        // Arrange
        const service = await createCalendarService(
          loggerMock,
          directoryMock,
          tokenProviderMock,
          INTAKE_CALENDAR_NAME,
          cacheMock as unknown as NodeCache,
        );
        axiosMock.get.mockResolvedValueOnce({
          data: { results: [{ name: 'Test', start: new Date().toISOString(), end: new Date().toISOString() }] },
        });

        // Act
        await service.getScheduledIntake(definition);

        // Assert
        expect(cacheMock.set).toHaveBeenCalledWith(expect.any(String), expect.objectContaining({ name: 'Test' }));
      });

      it('caches null when no active or upcoming intake is found', async () => {
        // Arrange
        const service = await createCalendarService(
          loggerMock,
          directoryMock,
          tokenProviderMock,
          INTAKE_CALENDAR_NAME,
          cacheMock as unknown as NodeCache,
        );
        axiosMock.get.mockResolvedValueOnce({ data: { results: [] } }).mockResolvedValueOnce({
          data: { results: [] },
        });

        // Act
        await service.getScheduledIntake(definition);

        // Assert
        expect(cacheMock.set).toHaveBeenCalledWith(expect.any(String), null);
      });
    });

    describe('updateScheduleIntake', () => {
      it('can update a scheduled intake', async () => {
        // Arrange
        const service = await createCalendarService(
          loggerMock,
          directoryMock,
          tokenProviderMock,
          INTAKE_CALENDAR_NAME,
          cacheMock as unknown as NodeCache,
        );
        const start = new Date();
        const end = new Date();
        axiosMock.patch.mockResolvedValueOnce({
          status: 200,
          data: {
            urn: 'urn:ads:platform:calendar-service:v1:/calendars/form-intake/events/123',
            name: 'Updated intake',
            description: 'Rescheduled intake window',
            start: start.toISOString(),
            end: end.toISOString(),
            isAllDay: false,
            isUpcoming: false,
          },
        });

        // Act
        const intake = await service.updateScheduleIntake(tenantId.toString(), {
          name: 'Updated intake',
          calendarEventId: '123',
          start,
          end,
          definitionId,
        });

        // Assert
        expect(intake.name).toBe('Updated intake');
        expect(intake.isUpcoming).toBe(false);
      });

      it('sends the updated start, end, and name to the calendar service', async () => {
        // Arrange
        const service = await createCalendarService(
          loggerMock,
          directoryMock,
          tokenProviderMock,
          INTAKE_CALENDAR_NAME,
          cacheMock as unknown as NodeCache,
        );
        const start = new Date();
        const end = new Date();
        axiosMock.patch.mockResolvedValueOnce({
          status: 200,
          data: { name: 'Updated intake', start: start.toISOString(), end: end.toISOString() },
        });

        // Act
        await service.updateScheduleIntake(tenantId.toString(), {
          name: 'Updated intake',
          calendarEventId: '123',
          start,
          end,
          definitionId,
        });

        // Assert
        expect(axiosMock.patch).toHaveBeenCalledWith(
          expect.stringContaining('/calendars/form-intake/events/123'),
          expect.objectContaining({ name: 'Updated intake', start, end }),
          expect.any(Object),
        );
      });

      it('returns undefined when the calendar service reports the event as not found', async () => {
        // Arrange
        const service = await createCalendarService(
          loggerMock,
          directoryMock,
          tokenProviderMock,
          INTAKE_CALENDAR_NAME,
          cacheMock as unknown as NodeCache,
        );
        axiosMock.patch.mockResolvedValueOnce({ status: 404, data: null });

        // Act
        const intake = await service.updateScheduleIntake(tenantId.toString(), {
          name: 'Updated intake',
          calendarEventId: 'missing-event',
          start: new Date(),
          end: new Date(),
          definitionId,
        });

        // Assert
        expect(intake).toBeUndefined();
      });

      it('returns undefined when the calendar service responds with no data', async () => {
        // Arrange
        const service = await createCalendarService(
          loggerMock,
          directoryMock,
          tokenProviderMock,
          INTAKE_CALENDAR_NAME,
          cacheMock as unknown as NodeCache,
        );
        axiosMock.patch.mockResolvedValueOnce({ status: 200, data: null });

        // Act
        const intake = await service.updateScheduleIntake(tenantId.toString(), {
          name: 'Updated intake',
          calendarEventId: '123',
          start: new Date(),
          end: new Date(),
          definitionId,
        });

        // Assert
        expect(intake).toBeUndefined();
      });

      it('returns undefined and logs an error on axios error', async () => {
        // Arrange
        const service = await createCalendarService(
          loggerMock,
          directoryMock,
          tokenProviderMock,
          INTAKE_CALENDAR_NAME,
          cacheMock as unknown as NodeCache,
        );
        const error = new Error('oh noes!');
        error['response'] = { data: { errorMessage: 'Something went wrong!' } };
        axiosMock.patch.mockRejectedValueOnce(error);
        axiosMock.isAxiosError.mockReturnValueOnce(true);

        // Act
        const intake = await service.updateScheduleIntake(tenantId.toString(), {
          name: 'Updated intake',
          calendarEventId: '123',
          start: new Date(),
          end: new Date(),
          definitionId,
        });

        // Assert
        expect(intake).toBeUndefined();
      });

      it('returns undefined and logs an error on unexpected error', async () => {
        // Arrange
        const service = await createCalendarService(
          loggerMock,
          directoryMock,
          tokenProviderMock,
          INTAKE_CALENDAR_NAME,
          cacheMock as unknown as NodeCache,
        );
        axiosMock.patch.mockRejectedValueOnce(new Error('oh noes!'));

        // Act
        const intake = await service.updateScheduleIntake(tenantId.toString(), {
          name: 'Updated intake',
          calendarEventId: '123',
          start: new Date(),
          end: new Date(),
          definitionId,
        });

        // Assert
        expect(intake).toBeUndefined();
      });
    });
  });
});
