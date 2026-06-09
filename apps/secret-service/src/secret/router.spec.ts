import { Logger } from 'winston';
import { createSecretRouter } from './router';

describe('router', () => {
  const loggerMock = {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  } as unknown as Logger;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createSecretRouter', () => {
    it('can create router', () => {
      const router = createSecretRouter({ logger: loggerMock });
      expect(router).toBeTruthy();
    });

    it('has POST route defined', () => {
      const router = createSecretRouter({ logger: loggerMock });
      const routes = router.stack.filter((layer) => layer.route).map((layer) => layer.route);
      const postRoute = routes.find((route) => route.path === '/');
      expect(postRoute).toBeDefined();
      expect(postRoute.stack).toBeDefined();
      expect(postRoute.stack.length).toBeGreaterThan(0);
    });

    it('has GET route with :id parameter defined', () => {
      const router = createSecretRouter({ logger: loggerMock });
      const routes = router.stack.filter((layer) => layer.route).map((layer) => layer.route);
      const getRoute = routes.find((route) => route.path === '/:id');
      expect(getRoute).toBeDefined();
      expect(getRoute.stack).toBeDefined();
      expect(getRoute.stack.length).toBeGreaterThan(0);
    });

    it('has exactly 2 routes defined', () => {
      const router = createSecretRouter({ logger: loggerMock });
      const routes = router.stack.filter((layer) => layer.route);
      expect(routes).toHaveLength(2);
    });
  });
});
