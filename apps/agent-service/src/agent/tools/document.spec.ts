import { createDocumentTools } from './document';

jest.mock('../utils/documentParser', () => ({
  extractDocumentText: jest.fn().mockResolvedValue({ text: 'Extracted document text', pageCount: 3 }),
  isExtractableDocument: jest.fn((mime: string) =>
    ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'].includes(mime),
  ),
}));

const mockGetFileAndMetadata = jest.fn();

jest.mock('../clients', () => ({
  createFileServiceClient: jest.fn(() => ({
    getFileAndMetadata: mockGetFileAndMetadata,
  })),
}));

const mockLogger = {
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn(),
};

const mockTokenProvider = {
  getAccessToken: jest.fn().mockResolvedValue('test-token'),
};

const mockDirectory = {
  getServiceUrl: jest.fn().mockResolvedValue(new URL('https://file-service.test/')),
  getResourceUrl: jest.fn().mockResolvedValue(new URL('https://file-service.test/files/test-uuid')),
};

const mockRequestContext = {
  get: jest.fn((key: string) => {
    if (key === 'tenantId') return { toString: () => 'test-tenant-id' };
    return undefined;
  }),
};

describe('createDocumentTools', () => {
  let tools: Awaited<ReturnType<typeof createDocumentTools>>;

  beforeAll(async () => {
    tools = await createDocumentTools({
      directory: mockDirectory as never,
      tokenProvider: mockTokenProvider as never,
      logger: mockLogger as never,
    });
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('creates documentExtractTool', () => {
    expect(tools.documentExtractTool).toBeDefined();
  });

  describe('documentExtractTool', () => {
    it('extracts text from a PDF file', async () => {
      mockGetFileAndMetadata.mockResolvedValueOnce({
        data: new Uint8Array([0x25, 0x50, 0x44, 0x46]),
        metadata: {
          filename: 'requirements.pdf',
          mimeType: 'application/pdf',
          urn: 'urn:ads:platform:file-service:v1:/files/test-uuid',
        },
      });

      const result = await tools.documentExtractTool.execute({ fileId: 'test-uuid' }, {
        requestContext: mockRequestContext,
      } as never);

      expect(result.text).toBe('Extracted document text');
      expect(result.filename).toBe('requirements.pdf');
      expect(result.mimeType).toBe('application/pdf');
      expect(result.pageCount).toBe(3);
    });

    it('falls back to UTF-8 for non-document files', async () => {
      mockGetFileAndMetadata.mockResolvedValueOnce({
        data: new TextEncoder().encode('plain text content'),
        metadata: {
          filename: 'notes.txt',
          mimeType: 'text/plain',
          urn: 'urn:ads:platform:file-service:v1:/files/text-uuid',
        },
      });

      const result = await tools.documentExtractTool.execute({ fileId: 'text-uuid' }, {
        requestContext: mockRequestContext,
      } as never);

      expect(result.text).toBe('plain text content');
      expect(result.filename).toBe('notes.txt');
      expect(result.mimeType).toBe('text/plain');
      expect(result.pageCount).toBeUndefined();
    });
  });
});
