import { AdspId, Tenant, TenantService } from '@abgov/adsp-service-sdk';
import { InvalidOperationError, NotFoundError } from '@core-services/core-common';
import { Request, RequestHandler } from 'express';
import 'express-session';

const TENANT_HEADER = 'x-adsp-tenant';
const TENANT_QUERY = 'tenant';
const TENANT_SESSION = 'tenantId';

// Tenant names can contain letters, digits, spaces and underscores. The kebab-case form of a name, with hyphens in
// place of spaces, is also accepted, and so hyphens are allowed here. Other values are not used to look up tenants.
const TENANT_NAME_PATTERN = /^[0-9A-Za-z _-]{1,50}$/;
const TENANT_VALUE_MAX_LENGTH = 100;

/**
 * Gets the tenant for a tenant URN or a tenant name.
 *
 * A name with hyphens is looked up as the kebab-case form of a name (with hyphens in place of spaces) first, which is
 * how the name has been provided, and then as it is. The name as it is is looked up for other names, which can have
 * letters in any case, such as camelCase names that the kebab-case form cannot be changed back to.
 */
export async function resolveTenant(tenantService: TenantService, value: string): Promise<Tenant | null> {
  try {
    if (value.length > TENANT_VALUE_MAX_LENGTH) {
      return null;
    }

    if (AdspId.isAdspId(value)) {
      return (await tenantService.getTenant(AdspId.parse(value))) || null;
    }

    if (!TENANT_NAME_PATTERN.test(value)) {
      return null;
    }

    const names = value.includes('-') ? [value.replace(/-/g, ' '), value] : [value];
    for (const name of names) {
      const tenant = await tenantService.getTenantByName(name);
      if (tenant) {
        return tenant;
      }
    }

    return null;
  } catch (err) {
    // For format issue, just return as not found.
    return null;
  }
}

type SignInStep = 'initiate' | 'complete';

/**
 * Gets the tenant that was provided for a request to sign in, which is the header of the request if it has one (for
 * example set by the proxy of an application so that the application can only be used with one tenant).
 *
 * To initiate sign in, it is otherwise the query parameter of the request. To complete sign in, it is otherwise the
 * tenant of the session in which sign in was initiated.
 */
function getTenantValue(req: Request, step: SignInStep): string {
  const header = req.headers[TENANT_HEADER];
  if (typeof header === 'string' && header) {
    return header;
  }

  const value = step === 'initiate' ? req.query?.[TENANT_QUERY] : req.session?.[TENANT_SESSION];
  return typeof value === 'string' ? value : '';
}

/**
 * Creates a handler that sets the tenant of requests that are made before the user is authenticated, which are the
 * requests to initiate sign in and to complete it. The tenant is a tenant name or tenant URN.
 */
export function createTenantHandler(tenantService: TenantService, step: SignInStep = 'initiate'): RequestHandler {
  return async function (req, _res, next) {
    try {
      const tenantIdValue = getTenantValue(req, step);
      if (!tenantIdValue) {
        throw new InvalidOperationError(
          step === 'initiate'
            ? `Tenant identity is required in the ${TENANT_HEADER} header or the ${TENANT_QUERY} query parameter.`
            : `Tenant identity is required in the ${TENANT_HEADER} header, or from signing in on the same session.`
        );
      }

      const tenant = await resolveTenant(tenantService, tenantIdValue);
      if (!tenant) {
        throw new NotFoundError('tenant', tenantIdValue.substring(0, TENANT_VALUE_MAX_LENGTH));
      }

      req.tenant = tenant;

      next();
    } catch (err) {
      next(err);
    }
  };
}

/**
 * Keeps the tenant of the request in the session, so that the request to complete sign in has it. The session is
 * cleared when the user is authenticated, after which the tenant is the tenant of the user.
 */
export const keepTenantInSession: RequestHandler = (req, _res, next) => {
  if (req.tenant && req.session) {
    req.session[TENANT_SESSION] = req.tenant.id.toString();
  }

  next();
};
