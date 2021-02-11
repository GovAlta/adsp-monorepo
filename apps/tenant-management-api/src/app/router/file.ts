import { Router } from 'express';
import * as HttpStatusCodes from 'http-status-codes';
import { check, validationResult } from 'express-validator/check';
const fileRouter = Router();
import * as fileService from '../services/file';
import * as _ from 'lodash';

const validateRole = (user) => {
  return _.includes(_.get(user, 'roles'), 'file-service-admin');
};

// Use the token in the request now. Might need to update or exchange token in future
const createFileJTW = (req) => {
  return req.headers.authorization;
};

const responseHelper = async (res, _promise) => {
  try {
    const result = await _promise;
    res.json(result);
  } catch (err) {
    res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR).json(err);
  }
};

fileRouter.get(
  '/types',
  [check('spaceId').not().isEmpty()],
  async (req, res) => {
    if (!validateRole(req.user)) {
      return res.send(HttpStatusCodes.UNAUTHORIZED);
    }
    const { spaceId } = req.query;
    const spaceTypesPromise = fileService.fetchSpaceTypes(
      spaceId,
      createFileJTW(req)
    );
    return await responseHelper(res, spaceTypesPromise);
  }
);

/**
 * @swagger
 *
 * /api/tenant/file/space:
 *   post:
 *     description: Fetch list of space for a tenant
 *     consumes: applicaiton/json
 *     parameters:
 *     - name: body
 *       in: body
 *       schema:
 *         type: object
 *         required: ['tenantId', realm]
 *         properties:
 *           tenantId:
 *             type: string
 *             description: tenant Id
 *           realm:
 *             type: string
 *             description: tenant realm
*/

fileRouter.post('/space',
  [
    check('tenantId').not().isEmpty(),
    check('realm').not().isEmpty()],
  async (req, res) => {
    if (!validateRole(req.user)) {
      return res.send(HttpStatusCodes.UNAUTHORIZED);
    }

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res
        .status(HttpStatusCodes.BAD_REQUEST)
        .json({ errors: errors.array() });
    }

    const { tenantId, realm } = req.body;

    const createSpacePromise = fileService.createSpacePromise(
      tenantId,
      realm,
      req.headers.authorization
    );

    try {
      const result = await createSpacePromise;
      res.json(result);
    } catch (err) {
      res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR).json(err);
    }
  }
);

export default fileRouter;
