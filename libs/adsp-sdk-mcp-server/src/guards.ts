import type * as express from 'express';
import { McpServerConfig } from './config';
import { getMetrics } from './metrics';

export function sendJsonRpcError(res: express.Response, status: number, message: string): void {
  res.status(status).json({ jsonrpc: '2.0', error: { code: -32000, message }, id: null });
}

function isAllowedOrigin(origin: string, corsOrigins: McpServerConfig['corsOrigins']): boolean {
  // Sandboxed frames and file: pages send "null", which can't be tied to any one site.
  if (origin === 'null') {
    return false;
  }
  return corsOrigins === '*' || corsOrigins.includes(origin.replace(/\/+$/, ''));
}

/** MCP requires servers to validate Origin (2025-11-25). Requests without one come from non-browser clients and pass. */
export function createCorsAndOriginGuard(corsOrigins: McpServerConfig['corsOrigins']): express.RequestHandler {
  return (req, res, next) => {
    res.vary('Origin');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, mcp-session-id, mcp-protocol-version');
    res.setHeader('Access-Control-Expose-Headers', 'mcp-session-id');

    const origin = req.headers.origin;
    if (origin !== undefined) {
      if (!isAllowedOrigin(origin, corsOrigins)) {
        getMetrics().recordRejection('origin');
        sendJsonRpcError(res, 403, 'Origin not allowed');
        return;
      }
      res.setHeader('Access-Control-Allow-Origin', corsOrigins === '*' ? '*' : origin);
    }

    if (req.method === 'OPTIONS') {
      res.sendStatus(204);
      return;
    }
    next();
  };
}
