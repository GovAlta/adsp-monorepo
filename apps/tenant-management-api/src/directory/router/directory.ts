import { Router } from 'express';
import { discovery, getDirectories, addDirectory, updateDirectory, deleteDirectory } from '../services';
import * as HttpStatusCodes from 'http-status-codes';
import { logger } from '../../middleware/logger';
import validationMiddleware from '../../middleware/requestValidator';
import { Directory } from '../validator/directory/directoryValidator';
import { requireDirectoryAdmin } from '../../middleware/authentication';

const directoryRouter = Router();
/**
 * Get all of directories
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
    return res.send(await discovery(urn as string));
  }
  logger.error('There is error on getting directory from urn');
  return res.status(HttpStatusCodes.BAD_REQUEST).json({ errors: 'There is no context in post' });
});
/**
 * Add one directory
 */
directoryRouter.post('/', requireDirectoryAdmin, validationMiddleware(Directory), async (req, res) => {
  if (req.body) {
    return res.status(HttpStatusCodes.CREATED).json(await addDirectory(req.body));
  }

  logger.error('post add/update error');
  return res.sendStatus(HttpStatusCodes.BAD_REQUEST).json({ errors: 'There is no context in post' });
});

/**
 * Update one directory
 */
directoryRouter.put('/:name', requireDirectoryAdmin, validationMiddleware(Directory), async (req, res) => {
  const { name } = req.params;
  if (req.body) {
    return res.status(HttpStatusCodes.CREATED).json(await updateDirectory({...req.body, name}));
  }

  logger.error('post add/update error');
  return res.sendStatus(HttpStatusCodes.BAD_REQUEST).json({ errors: 'There is no context in post' });
});

/**
 * Delete one directory by name
 */
directoryRouter.delete('/:name', requireDirectoryAdmin, validationMiddleware(null), async (req, res) => {
  const { name } = req.params;
  return res.status(HttpStatusCodes.ACCEPTED).json(await deleteDirectory(name));
});

export { directoryRouter };
