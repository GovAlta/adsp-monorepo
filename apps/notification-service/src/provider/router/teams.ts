import { Router } from 'express';
import { TeamsNotificationProvider } from '../teams';

interface RouterProps {
  provider: TeamsNotificationProvider;
}

export const createTeamsProviderRouter = ({ provider }: RouterProps): Router => {
  const router = Router();
  router.post('/messages', (req, res) => provider.processMessage(req, res));

  return router;
};
