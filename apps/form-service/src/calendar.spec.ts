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

  const cacheMock = {
    set: jest.fn(),
    get: jest.fn(),
  };

  const definition = new FormDefinitionEntity(validationService, tenantId, {
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
    axiosMock.isAxiosError.mockReset();
    cacheMock.get.mockReset();
  });

  it('can create service', () => {
    const service = createCalendarService(
      loggerMock,
      directoryMock,
      tokenProviderMock,
      INTAKE_CALENDAR_NAME,
      cacheMock as unknown as NodeCache
    );
    expect(service).toBeTruthy();
  });

  describe('CalendarService', () => {
    describe('getScheduledIntake', () => {
      it('can get active intake', async () => {
        const service = await createCalendarService(
          loggerMock,
          directoryMock,
          tokenProviderMock,
          INTAKE_CALENDAR_NAME,
          cacheMock as unknown as NodeCache
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
          cacheMock as unknown as NodeCache
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
          cacheMock as unknown as NodeCache
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
          cacheMock as unknown as NodeCache
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
          cacheMock as unknown as NodeCache
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
          cacheMock as unknown as NodeCache
        );

        const error = new Error('oh noes!');
        error['response'] = {};
        axiosMock.get.mockRejectedValueOnce(error);
        axiosMock.isAxiosError.mockReturnValueOnce(true);

        const intake = await service.getScheduledIntake(definition);
        expect(intake).toBeUndefined();
      });
    });
  });
});
