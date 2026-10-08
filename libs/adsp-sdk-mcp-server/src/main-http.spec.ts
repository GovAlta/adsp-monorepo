import { EventEmitter } from 'events';
import type { IncomingMessage, ServerResponse } from 'http';

// Captured by the http mock factory when main-http.ts calls createServer(handler)
const captured: { handler: ((req: IncomingMessage, res: ServerResponse) => void) | null } = {
  handler: null,
};

const mockHandleRequest = jest.fn().mockResolvedValue(undefined);
const mockConnect = jest.fn().mockResolvedValue(undefined);

jest.mock('http', () => ({
  createServer: jest.fn((h: (req: IncomingMessage, res: ServerResponse) => void) => {
    captured.handler = h;
    return { listen: jest.fn() };
  }),
}));

jest.mock('./docs/docsRepository', () => ({
  DocsRepository: jest.fn().mockImplementation(() => ({})),
}));

jest.mock('./server', () => ({
  createAdspMcpServer: jest.fn().mockReturnValue({ connect: mockConnect }),
}));

jest.mock('@modelcontextprotocol/sdk/server/streamableHttp.js', () => ({
  StreamableHTTPServerTransport: jest.fn().mockImplementation(() => ({
    handleRequest: mockHandleRequest,
  })),
}));

function makeReq(method: string, url: string): IncomingMessage {
  const req = new EventEmitter() as unknown as IncomingMessage;
  Object.assign(req, { method, url, headers: {} });
  return req;
}

interface MockRes {
  writeHead: jest.Mock;
  setHeader: jest.Mock;
  end: jest.Mock;
  headersSent: boolean;
}

function makeRes(): MockRes {
  return { writeHead: jest.fn(), setHeader: jest.fn(), end: jest.fn(), headersSent: false };
}

describe('main-http', () => {
  beforeAll(() => {
    // require (not import) so module runs after mock factories are installed
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    require('./main-http');
  });

  beforeEach(() => {
    jest.clearAllMocks();
    mockHandleRequest.mockResolvedValue(undefined);
    mockConnect.mockResolvedValue(undefined);
  });

  it('captures the request handler from createServer', () => {
    expect(captured.handler).toBeInstanceOf(Function);
  });

  it('OPTIONS /mcp returns 204 with CORS headers', () => {
    const res = makeRes();
    captured.handler!(makeReq('OPTIONS', '/mcp'), res as unknown as ServerResponse);

    expect(res.writeHead).toHaveBeenCalledWith(
      204,
      expect.objectContaining({ 'Access-Control-Allow-Origin': '*' })
    );
    expect(res.end).toHaveBeenCalled();
  });

  it('GET /health returns 200 with status ok', () => {
    const res = makeRes();
    captured.handler!(makeReq('GET', '/health'), res as unknown as ServerResponse);

    expect(res.writeHead).toHaveBeenCalledWith(200, expect.objectContaining({ 'Content-Type': 'application/json' }));
    expect(res.end).toHaveBeenCalledWith(JSON.stringify({ status: 'ok' }));
  });

  it('/health sets CORS headers', () => {
    const res = makeRes();
    captured.handler!(makeReq('GET', '/health'), res as unknown as ServerResponse);

    expect(res.setHeader).toHaveBeenCalledWith('Access-Control-Allow-Origin', '*');
  });

  it('POST /mcp creates a fresh transport and server per request then calls handleRequest', async () => {
    const req = makeReq('POST', '/mcp');
    const res = makeRes();
    captured.handler!(req, res as unknown as ServerResponse);

    await new Promise((r) => setTimeout(r, 20));

    expect(mockConnect).toHaveBeenCalled();
    expect(mockHandleRequest).toHaveBeenCalledWith(req, res);
  });

  it('GET /unknown returns 404', () => {
    const res = makeRes();
    captured.handler!(makeReq('GET', '/unknown'), res as unknown as ServerResponse);

    expect(res.writeHead).toHaveBeenCalledWith(404);
    expect(res.end).toHaveBeenCalled();
  });
});
