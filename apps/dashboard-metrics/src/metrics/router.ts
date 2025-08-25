import { RequestHandler, Router } from 'express';
import { MetricsRepository } from './repository';

export function getMetricsResource(repository: MetricsRepository): RequestHandler {
  return async (req, res, next) => {
    try {
      const { interval } = req.params;

      const metrics = await repository.readMetrics(interval);
      res.json(metrics);
    } catch (err) {
      next(err);
    }
  };
}

interface MetricsRepositoryProps {
  repository: MetricsRepository;
}

export function createMetricsRouter({ repository }: MetricsRepositoryProps) {
  const router = Router();

  router.get('/metrics/:interval', getMetricsResource(repository));

  return router;
}
