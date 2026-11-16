import * as express from 'express';
import { Request, Response } from 'express';
import { ColumnType, MockList, MockSite } from './seed';
import { FaultKind, MockState } from './state';
import { renderViewer } from './viewer';

const graphError = (res: Response, status: number, code: string, message: string) =>
  res.status(status).json({ error: { code, message } });

const matchesType = (type: ColumnType, value: unknown): boolean => {
  switch (type) {
    case 'text':
      return typeof value === 'string';
    case 'number':
      return typeof value === 'number';
    case 'boolean':
      return typeof value === 'boolean';
    case 'dateTime':
      return typeof value === 'string' && !Number.isNaN(Date.parse(value));
  }
};

const fieldError = (list: MockList, fields: Record<string, unknown>): string | null => {
  for (const [name, value] of Object.entries(fields)) {
    const column = list.columns.find((candidate) => candidate.name === name);
    if (!column) {
      return `Field '${name}' is not recognized`;
    }
    if (value !== null && !matchesType(column.type, value)) {
      return `Field '${name}' has a value that is not valid for type '${column.type}'`;
    }
  }
  return null;
};

const FILTER_PATTERN = /^fields\/(\w+) eq '((?:[^']|'')*)'$/;
const FAULT_KINDS: FaultKind[] = ['throttle', 'unavailable'];

export function createSharePointMockApp(state: MockState): express.Application {
  const app = express();
  app.use(express.json());
  app.use(express.urlencoded({ extended: false }));

  app.post('/:tenantId/oauth2/v2.0/token', (req, res) => {
    const { client_id: clientId, client_secret: clientSecret, grant_type: grantType } = req.body ?? {};
    if (grantType !== 'client_credentials') {
      return res.status(400).json({
        error: 'unsupported_grant_type',
        error_description: 'AADSTS70003: Unsupported grant type.',
        error_codes: [70003],
      });
    }
    const registration = state.findApp(req.params.tenantId, clientId);
    if (!registration) {
      return res.status(400).json({
        error: 'unauthorized_client',
        error_description: `AADSTS700016: Application with identifier '${clientId}' was not found in the directory.`,
        error_codes: [700016],
      });
    }
    if (registration.secret !== clientSecret) {
      return res.status(401).json({
        error: 'invalid_client',
        error_description: 'AADSTS7000215: Invalid client secret provided.',
        error_codes: [7000215],
      });
    }
    if (Date.parse(registration.expiresAt) <= Date.now()) {
      return res.status(401).json({
        error: 'invalid_client',
        error_description: `AADSTS7000222: The provided client secret keys for app '${clientId}' are expired.`,
        error_codes: [7000222],
      });
    }
    res.json({ token_type: 'Bearer', expires_in: 3599, access_token: state.issueToken(clientId) });
  });

  const graph = express.Router();

  graph.use((req, res, next) => {
    const fault = state.takeFault();
    if (fault === 'throttle') {
      res.set('Retry-After', '2');
      return graphError(res, 429, 'TooManyRequests', 'Too many requests.');
    }
    if (fault === 'unavailable') {
      return graphError(res, 503, 'serviceNotAvailable', 'Service unavailable.');
    }
    const [scheme, token] = (req.headers.authorization ?? '').split(' ');
    const clientId = scheme === 'Bearer' && token ? state.clientForToken(token) : null;
    if (!clientId) {
      return graphError(res, 401, 'InvalidAuthenticationToken', 'Access token is empty or invalid.');
    }
    res.locals.clientId = clientId;
    next();
  });

  const resolveSite = (req: Request, res: Response, role: 'read' | 'write'): MockSite | null => {
    const site = state.findSite(req.params.siteId);
    if (!site) {
      graphError(res, 404, 'itemNotFound', 'Requested site could not be found.');
      return null;
    }
    const grant = site.grants.find((candidate) => candidate.clientId === res.locals.clientId);
    if (!grant || (role === 'write' && grant.role !== 'write')) {
      graphError(res, 403, 'accessDenied', 'Access denied.');
      return null;
    }
    return site;
  };

  const resolveList = (req: Request, res: Response, role: 'read' | 'write'): MockList | null => {
    const site = resolveSite(req, res, role);
    if (!site) {
      return null;
    }
    const list = site.lists.find((candidate) => candidate.listId === req.params.listId);
    if (!list) {
      graphError(res, 404, 'itemNotFound', 'List not found.');
      return null;
    }
    return list;
  };

  graph.get('/sites/:siteId', (req, res) => {
    const site = resolveSite(req, res, 'read');
    if (site) {
      res.json({ id: site.siteId, displayName: site.displayName });
    }
  });

  graph.get('/sites/:siteId/lists/:listId/items', (req, res) => {
    const list = resolveList(req, res, 'read');
    if (!list) {
      return;
    }
    let items = state.listItems(list.listId);
    const filter = req.query['$filter'];
    if (typeof filter === 'string') {
      const match = FILTER_PATTERN.exec(filter);
      if (!match) {
        return graphError(res, 400, 'invalidRequest', 'Invalid filter clause.');
      }
      const [, columnName, rawValue] = match;
      const column = list.columns.find((candidate) => candidate.name === columnName);
      if (!column) {
        return graphError(res, 400, 'invalidRequest', `Field '${columnName}' is not recognized`);
      }
      const prefer = String(req.headers['prefer'] ?? '');
      if (!column.indexed && !prefer.includes('HonorNonIndexedQueriesWarningMayFailRandomly')) {
        return graphError(
          res,
          400,
          'invalidRequest',
          `Field '${columnName}' cannot be referenced in filter or orderby as it is not indexed.`,
        );
      }
      const value = rawValue.replace(/''/g, "'");
      items = items.filter((item) => item.fields[columnName] === value);
    }
    res.json({ value: items.map((item) => ({ id: item.id, fields: item.fields })) });
  });

  graph.post('/sites/:siteId/lists/:listId/items', (req, res) => {
    const list = resolveList(req, res, 'write');
    if (!list) {
      return;
    }
    const fields = req.body?.fields ?? {};
    const invalid = fieldError(list, fields);
    if (invalid) {
      return graphError(res, 400, 'invalidRequest', invalid);
    }
    const item = state.createItem(list.listId, fields);
    res.status(201).json({ id: item.id, fields: item.fields });
  });

  graph.patch('/sites/:siteId/lists/:listId/items/:itemId/fields', (req, res) => {
    const list = resolveList(req, res, 'write');
    if (!list) {
      return;
    }
    const fields = req.body ?? {};
    const invalid = fieldError(list, fields);
    if (invalid) {
      return graphError(res, 400, 'invalidRequest', invalid);
    }
    const item = state.updateItem(list.listId, req.params.itemId, fields);
    if (!item) {
      return graphError(res, 404, 'itemNotFound', 'Item not found.');
    }
    res.json(item.fields);
  });

  app.use('/v1.0', graph);

  app.get('/_mock', (_req, res) => {
    res.type('html').send(renderViewer(state));
  });
  app.get('/_mock/state', (_req, res) => {
    res.json(state.snapshot());
  });
  app.post('/_mock/faults', (req, res) => {
    const { kind, count } = req.body ?? {};
    if (!FAULT_KINDS.includes(kind) || !Number.isInteger(count) || count < 0) {
      return res.status(400).json({ error: 'kind must be throttle or unavailable, and count a non-negative integer.' });
    }
    state.setFault(kind, count);
    res.json({ kind, count });
  });
  app.post('/_mock/reset', (_req, res) => {
    state.reset();
    res.sendStatus(204);
  });

  return app;
}
