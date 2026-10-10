import { adspId } from '@abgov/adsp-service-sdk';
import type { EventService } from '@abgov/adsp-service-sdk';
import { Application } from 'express';
import { Logger } from 'winston';
import { applyPlannerMiddleware } from './index';
import { createPlannerRouter } from './router';

jest.mock('./router', () => ({ createPlannerRouter: jest.fn() }));

describe('applyPlannerMiddleware', () => {
  const serviceId = adspId`urn:ads:platform:project-planner-service`;
  const routerMock = jest.fn();
  const createPlannerRouterMock = createPlannerRouter as jest.Mock;
  const appMock = { use: jest.fn() };
  const logger = {} as Logger;
  const eventService = {} as EventService;
  const solutionRepository = { find: jest.fn(), get: jest.fn(), save: jest.fn(), delete: jest.fn() };

  beforeEach(() => {
    createPlannerRouterMock.mockReturnValue(routerMock);
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('mounts the planner router at /planner/v1', () => {
    applyPlannerMiddleware(appMock as unknown as Application, { serviceId, logger, solutionRepository, eventService });

    expect(appMock.use).toHaveBeenCalledWith('/planner/v1', routerMock);
  });

  it('creates the router with the v1 api id and dependencies', () => {
    applyPlannerMiddleware(appMock as unknown as Application, { serviceId, logger, solutionRepository, eventService });

    expect(createPlannerRouterMock).toHaveBeenCalledWith({
      apiId: expect.objectContaining({}),
      logger,
      solutionRepository,
      eventService,
    });
  });

  it('derives the api id from the service id', () => {
    applyPlannerMiddleware(appMock as unknown as Application, { serviceId, logger, solutionRepository, eventService });

    expect(createPlannerRouterMock.mock.calls[0][0].apiId.toString()).toBe(`${serviceId}:v1`);
  });

  it('returns the application', () => {
    const result = applyPlannerMiddleware(appMock as unknown as Application, {
      serviceId,
      logger,
      solutionRepository,
      eventService,
    });

    expect(result).toBe(appMock);
  });
});
