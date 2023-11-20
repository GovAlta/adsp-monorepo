import { InvalidOperationError } from '@core-services/core-common';
import { randomBytes } from 'crypto';
import { NextFunction, Request, Response } from 'express';

const SESSION_PROPERTY_NAME = 'csrfToken';

const CSRF_HEADER_NAME = 'X-XSRF-TOKEN';
const CSRF_COOKIE_NAME = 'XSRF-TOKEN';

/**
 * Generate a CSRF token, set on the session and return via a cookie, for Cookie-to-Header scheme.
 *
 * @export
 * @param {Request} req
 * @param {Response} res
 */
export function generateCsrfToken(req: Request, res: Response) {
  if (req.user) {
    const token = randomBytes(16).toString('hex');
    req.session[SESSION_PROPERTY_NAME] = token;
    res.cookie(CSRF_COOKIE_NAME, token, {
      httpOnly: false,
      sameSite: 'strict',
      secure: req.protocol !== 'http',
      signed: false,
    });
  }
}

export function csrfHandler(req: Request, res: Response, next: NextFunction) {
  // Skip check for HEAD and OPTIONS requests. GETs are included since APIs are not guaranteed to have no side effects on GET.
  if (['HEAD', 'OPTIONS'].includes(req.method)) {
    next();
  } else if (req.user) {
    const sessionToken = req.session[SESSION_PROPERTY_NAME];
    const requestToken = req.headers[CSRF_HEADER_NAME];

    // There should always be a CSRF token on the session; generate one on authentication success.
    const err =
      sessionToken !== requestToken ? new InvalidOperationError('Request must include valid CSRF token.') : null;

    // TODO: Ideally generate a new token for subsequent requests here,
    // but that causes churn on session data that needs to be saved again.

    next(err);
  }
}
