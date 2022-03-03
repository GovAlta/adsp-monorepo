import { Router } from 'express';
import { TeamsNotificationProvider } from '../teams';

interface RouterProps {
  provider: TeamsNotificationProvider;
}

export const createTeamsProviderRouter = ({ provider }: RouterProps): Router => {
  const router = Router();
  router.post('/messages', async (req, res, next) => {
    try {
      await provider.processMessage(req, res);
    } catch (err) {
      next(err);
    }
  });

  return router;
};
