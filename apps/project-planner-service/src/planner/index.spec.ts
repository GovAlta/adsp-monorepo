import type { EventService } from '@abgov/adsp-service-sdk';
import { Application } from 'express';
import { Logger } from 'winston';
import { applyPlannerMiddleware } from './index';
import { createPlannerRouter } from './router';

jest.mock('./router', () => ({ createPlannerRouter: jest.fn() }));

describe('applyPlannerMiddleware', () => {
  const routerMock = jest.fn();
  const createPlannerRouterMock = createPlannerRouter as jest.Mock;
  const appMock = { use: jest.fn() };
  const logger = {} as Logger;
  const eventService = {} as EventService;
  const solutionRepository = { find: jest.fn(), get: jest.fn(), save: jest.fn(), delete: jest.fn() };
  const patternRepository = { find: jest.fn(), save: jest.fn(), delete: jest.fn() };
  const specialistChatRepository = { find: jest.fn(), get: jest.fn(), save: jest.fn(), delete: jest.fn() };

  beforeEach(() => {
    createPlannerRouterMock.mockReturnValue(routerMock);
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('mounts the planner router at /planner/v1', () => {
    applyPlannerMiddleware(appMock as unknown as Application, {
      logger,
      solutionRepository,
      patternRepository,
      specialistChatRepository,
      eventService,
    });

    expect(appMock.use).toHaveBeenCalledWith('/planner/v1', routerMock);
  });

  it('creates the router with the dependencies', () => {
    applyPlannerMiddleware(appMock as unknown as Application, {
      logger,
      solutionRepository,
      patternRepository,
      specialistChatRepository,
      eventService,
    });

    expect(createPlannerRouterMock).toHaveBeenCalledWith({
      logger,
      solutionRepository,
      patternRepository,
      specialistChatRepository,
      eventService,
    });
  });

  it('passes the ADSP catalog reader to the router', () => {
    const readAdspCatalog = jest.fn();

    applyPlannerMiddleware(appMock as unknown as Application, {
      logger,
      solutionRepository,
      patternRepository,
      specialistChatRepository,
      eventService,
      readAdspCatalog,
    });

    expect(createPlannerRouterMock).toHaveBeenCalledWith(expect.objectContaining({ readAdspCatalog }));
  });

  it('returns the application', () => {
    const result = applyPlannerMiddleware(appMock as unknown as Application, {
      logger,
      solutionRepository,
      patternRepository,
      specialistChatRepository,
      eventService,
    });

    expect(result).toBe(appMock);
  });
});
