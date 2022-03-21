import { RequestHandler, Router } from 'express';
import { BotNotificationProvider } from '../bot';

interface RouterProps {
  provider: BotNotificationProvider;
}

export function processMessage(provider: BotNotificationProvider): RequestHandler {
  return async (req, res, next) => {
    try {
      await provider.processMessage(req, res);
    } catch (err) {
      next(err);
    }
  };
}

export const createBotProviderRouter = ({ provider }: RouterProps): Router => {
  const router = Router();
  router.post('/messages', processMessage(provider));

  return router;
};
