import { readFileSync } from 'fs';
import type { RequestHandler } from 'express';
import { parse } from 'yaml';

interface ObservedResponse {
  method: string;
  path: string;
  status: number;
}

type SwaggerPaths = Record<string, Record<string, { responses?: Record<string, unknown> }>>;

/**
 * Records the responses sent by an express app so that a spec can check them against the operations and response
 * codes documented in a swagger (OpenAPI) YAML file.
 *
 * Mount `middleware` before the router under test, then call `assertDocumented()` (for example in afterEach) to fail
 * if a response used a status code that the documentation does not list for that path and method.
 */
export function createDocumentedResponseRecorder(swaggerFile: string) {
  const document = parse(readFileSync(swaggerFile, 'utf8'));
  // Service swagger files are either full documents or swagger-jsdoc fragments with paths at the root.
  const paths: SwaggerPaths = document.paths || document;

  // Match literal paths before templated ones, so that for example /subscribers/my-subscriber is not read as
  // /subscribers/{subscriber}.
  const templates = Object.keys(paths)
    .filter((path) => path.startsWith('/'))
    .map((path) => ({
      path,
      params: (path.match(/\{[^}]+\}/g) || []).length,
      pattern: new RegExp(`^${path.replace(/\{[^}]+\}/g, '[^/]+')}$`),
    }))
    .sort((a, b) => a.params - b.params);

  let observed: ObservedResponse[] = [];

  const middleware: RequestHandler = (req, res, next) => {
    res.on('finish', () => {
      observed.push({
        method: req.method.toLowerCase(),
        path: new URL(req.originalUrl, 'http://localhost').pathname,
        status: res.statusCode,
      });
    });
    next();
  };

  const findOperation = (method: string, path: string) => {
    const template = templates.find(({ pattern }) => pattern.test(path));
    return template && { path: template.path, operation: paths[template.path][method] };
  };

  const assertDocumented = async () => {
    // The finish event can trail the client receiving the response by a tick.
    await new Promise((resolve) => setTimeout(resolve, 0));

    const undocumented = observed
      .map((response) => {
        const found = findOperation(response.method, response.path);
        if (!found?.operation) {
          return `${response.method.toUpperCase()} ${response.path} is not a documented operation`;
        }
        if (!(`${response.status}` in (found.operation.responses || {}))) {
          return `${response.method.toUpperCase()} ${found.path} responded ${response.status}, which is not documented`;
        }
        return null;
      })
      .filter((message) => !!message);

    observed = [];
    if (undocumented.length > 0) {
      throw new Error(`Undocumented responses:\n${undocumented.join('\n')}`);
    }
  };

  return { middleware, assertDocumented };
}
