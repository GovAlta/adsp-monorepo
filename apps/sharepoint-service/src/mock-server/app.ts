import * as express from 'express';
import { Request, Response } from 'express';
import { ColumnType, MockColumn, MockList, MockRole, MockSite } from './seed';
import { FaultKind, MockState } from './state';
import { renderViewer } from './viewer';

const graphError = (res: Response, status: number, code: string, message: string) =>
  res.status(status).json({ error: { code, message } });

const ROLE_RANK: Record<MockRole, number> = { read: 1, write: 2, owner: 3, fullcontrol: 4 };

const matchesType = (type: ColumnType, value: unknown): boolean => {
  switch (type) {
    case 'text':
    case 'multilineText':
      return typeof value === 'string';
    case 'number':
      return typeof value === 'number';
    case 'boolean':
      return typeof value === 'boolean';
    case 'dateTime':
      return typeof value === 'string' && !Number.isNaN(Date.parse(value));
    case 'multiChoice':
      return Array.isArray(value) && value.every((choice) => typeof choice === 'string');
    case 'hyperlink':
      return typeof (value as { Url?: unknown })?.Url === 'string';
  }
};

const FACETS: Record<ColumnType, Record<string, unknown>> = {
  text: { text: { allowMultipleLines: false } },
  multilineText: { text: { allowMultipleLines: true } },
  number: { number: {} },
  dateTime: { dateTime: {} },
  boolean: { boolean: {} },
  multiChoice: { choice: { displayAs: 'checkBoxes' } },
  // Graph lists Hyperlink columns without a type facet.
  hyperlink: {},
};

// SharePoint names a new column after the display name it is created with, and never reuses a name.
const internalName = (list: MockList, displayName: string): string => {
  const encoded = displayName
    .replace(/[^A-Za-z0-9_]/g, (char) => `_x${char.charCodeAt(0).toString(16).padStart(4, '0')}_`)
    .slice(0, 32);
  let name = encoded;
  for (let suffix = 0; list.columns.some((column) => column.name === name); suffix++) {
    name = `${encoded}${suffix}`;
  }
  return name;
};

const columnJson = (column: MockColumn) => ({
  id: `column-${column.name}`,
  name: column.name,
  displayName: column.displayName ?? column.name,
  indexed: !!column.indexed,
  required: !!column.required,
  ...FACETS[column.type],
});

const typeFromFacets = (body: Record<string, unknown>): ColumnType | null => {
  if (body.text) {
    return (body.text as { allowMultipleLines?: boolean }).allowMultipleLines ? 'multilineText' : 'text';
  }
  if (body.number) {
    return 'number';
  }
  if (body.dateTime) {
    return 'dateTime';
  }
  if (body.boolean) {
    return 'boolean';
  }
  if (body.choice) {
    return 'multiChoice';
  }
  if (body.hyperlinkOrPicture) {
    return 'hyperlink';
  }
  return null;
};

const DISPLAY_NAME_FILTER = /^displayName eq '((?:[^']|'')*)'$/;

const TYPE_ANNOTATION = '@odata.type';
const COLLECTION_TYPE = 'Collection(Edm.String)';

const fieldError = (list: MockList, fields: Record<string, unknown>): string | null => {
  for (const [name, value] of Object.entries(fields)) {
    if (name.endsWith(TYPE_ANNOTATION)) {
      const annotated = list.columns.find((candidate) => `${candidate.name}${TYPE_ANNOTATION}` === name);
      if (annotated?.type !== 'multiChoice' || value !== COLLECTION_TYPE) {
        return `Field '${name}' is not recognized`;
      }
      continue;
    }
    const column = list.columns.find((candidate) => candidate.name === name);
    if (!column) {
      return `Field '${name}' is not recognized`;
    }
    if (column.type === 'multiChoice' && value !== null && fields[`${name}${TYPE_ANNOTATION}`] !== COLLECTION_TYPE) {
      return `Field '${name}' needs '${name}${TYPE_ANNOTATION}' set to '${COLLECTION_TYPE}' for multiple values`;
    }
    if (value !== null && !matchesType(column.type, value)) {
      return `Field '${name}' has a value that is not valid for type '${column.type}'`;
    }
  }
  return null;
};

const withoutAnnotations = (fields: Record<string, unknown>): Record<string, unknown> =>
  Object.fromEntries(Object.entries(fields).filter(([name]) => !name.endsWith(TYPE_ANNOTATION)));

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

  const resolveSite = (req: Request, res: Response, role: MockRole): MockSite | null => {
    const site = state.findSite(req.params.siteId);
    if (!site) {
      graphError(res, 404, 'itemNotFound', 'Requested site could not be found.');
      return null;
    }
    const grant = site.grants.find((candidate) => candidate.clientId === res.locals.clientId);
    if (!grant || ROLE_RANK[grant.role] < ROLE_RANK[role]) {
      graphError(res, 403, 'accessDenied', 'Access denied.');
      return null;
    }
    return site;
  };

  const resolveList = (req: Request, res: Response, role: MockRole): MockList | null => {
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

  graph.get('/sites/:siteId/lists', (req, res) => {
    const site = resolveSite(req, res, 'read');
    if (!site) {
      return;
    }
    let lists = site.lists;
    const filter = req.query['$filter'];
    if (typeof filter === 'string') {
      const match = DISPLAY_NAME_FILTER.exec(filter);
      if (!match) {
        return graphError(res, 400, 'invalidRequest', 'Invalid filter clause.');
      }
      const name = match[1].replace(/''/g, "'");
      lists = lists.filter(({ displayName }) => displayName === name);
    }
    res.json({ value: lists.map(({ listId, displayName }) => ({ id: listId, displayName })) });
  });

  graph.post('/sites/:siteId/lists', (req, res) => {
    const site = resolveSite(req, res, 'owner');
    if (!site) {
      return;
    }
    const displayName = req.body?.displayName;
    if (typeof displayName !== 'string' || !displayName) {
      return graphError(res, 400, 'invalidRequest', 'A list needs a displayName.');
    }
    if (site.lists.some((list) => list.displayName === displayName)) {
      return graphError(res, 409, 'nameAlreadyExists', 'A list with that name already exists.');
    }
    const list = state.createList(site, displayName);
    res.status(201).json({ id: list.listId, displayName: list.displayName });
  });

  graph.get('/sites/:siteId/lists/:listId/columns', (req, res) => {
    const list = resolveList(req, res, 'read');
    if (list) {
      res.json({ value: list.columns.map(columnJson) });
    }
  });

  graph.post('/sites/:siteId/lists/:listId/columns', (req, res) => {
    const list = resolveList(req, res, 'owner');
    if (!list) {
      return;
    }
    const body = req.body ?? {};
    const type = typeFromFacets(body);
    if (typeof body.name !== 'string' || !/^[A-Za-z_][A-Za-z0-9_]*$/.test(body.name) || !type) {
      return graphError(res, 400, 'invalidRequest', 'Invalid column definition.');
    }
    const displayName = typeof body.displayName === 'string' && body.displayName ? body.displayName : body.name;
    const column: MockColumn = {
      name: internalName(list, displayName),
      displayName,
      type,
      indexed: !!body.indexed,
    };
    state.addColumn(list, column);
    res.status(201).json(columnJson(column));
  });

  graph.patch('/sites/:siteId/lists/:listId/columns/:columnId', (req, res) => {
    const list = resolveList(req, res, 'owner');
    if (!list) {
      return;
    }
    const column = list.columns.find((candidate) => columnJson(candidate).id === req.params.columnId);
    if (!column) {
      return graphError(res, 404, 'itemNotFound', 'Column not found.');
    }
    if (typeof req.body?.indexed === 'boolean') {
      column.indexed = req.body.indexed;
    }
    if (typeof req.body?.required === 'boolean') {
      column.required = req.body.required;
    }
    if (typeof req.body?.displayName === 'string' && req.body.displayName) {
      column.displayName = req.body.displayName;
    }
    res.json(columnJson(column));
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
    const item = state.createItem(list.listId, withoutAnnotations(fields));
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
    const item = state.updateItem(list.listId, req.params.itemId, withoutAnnotations(fields));
    if (!item) {
      return graphError(res, 404, 'itemNotFound', 'Item not found.');
    }
    res.json(item.fields);
  });

  graph.delete('/sites/:siteId/lists/:listId/items/:itemId', (req, res) => {
    const list = resolveList(req, res, 'write');
    if (!list) {
      return;
    }
    if (!state.deleteItem(list.listId, req.params.itemId)) {
      return graphError(res, 404, 'itemNotFound', 'Item not found.');
    }
    res.status(204).end();
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
