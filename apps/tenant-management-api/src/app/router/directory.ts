import { Router } from 'express';
const directoryRouter = Router();
import { discovery, getDirectories, addDirectory, updateDirectory, deleteDirectory } from '../services/discovery';
import * as HttpStatusCodes from 'http-status-codes';
import { logger } from '../../middleware/logger';
import validationMiddleware from '../../middleware/requestValidator';
import { Directory } from '../validator/directory/directoryValidator';
/**
 * Get all of directoies
 */
directoryRouter.get('/', async (req, res) => {
  return res.send(await getDirectories());
});

/**
 * Get one directory by urn
 */
directoryRouter.get('/urn', validationMiddleware(null), async (req, res) => {
  if (req.query.urn) {
    const { urn } = req.query;
    return res.send(await discovery(urn));
  }
  logger.error('There is error on getting directory from urn');
  return res.status(HttpStatusCodes.BAD_REQUEST).json({ errors: 'There is no context in post' });
});
/**
 * Add one directory
 */
directoryRouter.post('/', validationMiddleware(Directory), async (req, res) => {
  if (req.body) {
    return res.status(HttpStatusCodes.CREATED).json(await addDirectory(req.body));
  }

  logger.error('post add/update error');
  return res.sendStatus(HttpStatusCodes.BAD_REQUEST).json({ errors: 'There is no context in post' });
});

/**
 * Update one directory
 */
directoryRouter.put('/', validationMiddleware(Directory), async (req, res) => {
  if (req.body) {
    return res.status(HttpStatusCodes.CREATED).json(await updateDirectory(req.body));
  }

  logger.error('post add/update error');
  return res.sendStatus(HttpStatusCodes.BAD_REQUEST).json({ errors: 'There is no context in post' });
});

/**
 * Delete one directory by name
 */
directoryRouter.delete('/:name', validationMiddleware(null), async (req, res) => {
  const { name } = req.params;
  return res.status(HttpStatusCodes.ACCEPTED).json(await deleteDirectory(name));
});

export default directoryRouter;
