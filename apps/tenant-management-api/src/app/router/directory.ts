import { Router } from 'express';
const directoryRouter = Router();
import {
  discovery,
  getDirectories,
  addUpdateDirectory,
  deleteDirectory,
} from '../services/discovery';
import * as HttpStatusCodes from 'http-status-codes';
import { logger } from '../../middleware/logger';
import { check, validationResult } from 'express-validator/check';
import validationMiddleware from '../../middleware/requestValidator';

/**
 * Get all of directoies
 */
directoryRouter.get('/', async (req, res) => {
  return res.send(await getDirectories());
});

/**
 * Get one directory by urn
 */
directoryRouter.get('/urn', async (req, res,next) => {
  // const errors = validationResult(req);
  // if (!errors.isEmpty()) {
  //   return res
  //     .status(HttpStatusCodes.BAD_REQUEST)
  //     .json({ errors: errors.array() });
  // }

  //const error = await validationMiddleware(req, res,next,null);
  // console.log(error);
  if (req.query.urn) {
    const { urn } = req.query;
    return res.send(await discovery(urn));
  }
  logger.error('There is error on getting directory from urn');
  return res
    .status(HttpStatusCodes.BAD_REQUEST)
    .json({ errors: 'There is no context in post' });
});
/**
 * Add or update one directory
 */
directoryRouter.post(
  '/',
  [
    check('name', 'name is required').not().isEmpty(),
    check('services', 'services is required').not().isEmpty(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res
        .sendStatus(HttpStatusCodes.BAD_REQUEST)
        .json({ errors: errors.array() });
    }

    if (req.body) {
      return res
        .status(HttpStatusCodes.CREATED)
        .json({ successfulCode: await addUpdateDirectory(req.body) });
    }
    logger.error('post add/update error');
    return res
      .sendStatus(HttpStatusCodes.BAD_REQUEST)
      .json({ errors: 'There is no context in post' });
  }
);

/**
 * Delete one directory by name
 */
directoryRouter.delete(
  '/',
  [check('name', 'name is required').not().isEmpty()],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res
        .status(HttpStatusCodes.BAD_REQUEST)
        .json({ errors: errors.array() });
    }
    return res
      .status(HttpStatusCodes.ACCEPTED)
      .json({ successfulCode: await deleteDirectory(req.body.name) });
  }
);

export default directoryRouter;
