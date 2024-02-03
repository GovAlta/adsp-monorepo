import { InvalidOperationError } from '@core-services/core-common';
import { randomBytes } from 'crypto';
import { NextFunction, Request, Response } from 'express';

const SESSION_PROPERTY_NAME = 'csrfToken';

const CSRF_HEADER_NAME = 'x-xsrf-token';
const CSRF_COOKIE_NAME = 'XSRF-TOKEN';

/**
 * Generate a CSRF token, set on the session and return via a cookie, for Cookie-to-Header scheme.
 *
 * @export
 * @param {Request} req
 * @param {Response} res
 */
export function generateCsrfToken(req: Request, res: Response) {
  // If there is no session, then there's nothing to tie the token to.
  if (!req.session) {
    throw new Error('No session when generating CSRF token.');
  }

  const token = randomBytes(16).toString('hex');
  req.session[SESSION_PROPERTY_NAME] = token;

  // This specifically needs to be not http-only so that frontend js can read and pass in the header.
  res.cookie(CSRF_COOKIE_NAME, token, {
    httpOnly: false,
    sameSite: 'strict',
    secure: req.protocol !== 'http',
    signed: false,
  });
}

export function csrfHandler(req: Request, _res: Response, next: NextFunction) {
  // Skip check for HEAD, OPTIONS and GET requests. Note that this means APIs should not use GET for mutations.
  if (['HEAD', 'OPTIONS', 'GET'].includes(req.method)) {
    next();
  } else if (!req.session) {
    next(new Error('No session when verifying CSRF token.'));
  } else {
    const sessionToken = req.session[SESSION_PROPERTY_NAME];
    const requestToken = req.headers[CSRF_HEADER_NAME];

    // There should always be a CSRF token on the session; generate one on authentication success.
    const err =
      sessionToken !== requestToken ? new InvalidOperationError('Request must include valid CSRF token.') : undefined;

    // TODO: Ideally generate a new token for subsequent requests here,
    // but that causes churn on session data that needs to be saved again.

    next(err);
  }
}
