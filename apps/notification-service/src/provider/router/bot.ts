import { Router } from 'express';
import { BotNotificationProvider } from '../bot';

interface RouterProps {
  provider: BotNotificationProvider;
}

export const createBotProviderRouter = ({ provider }: RouterProps): Router => {
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
