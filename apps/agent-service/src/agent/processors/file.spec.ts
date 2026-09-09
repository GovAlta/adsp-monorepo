import { AdspId } from '@abgov/adsp-service-sdk';
import { convertUint8ArrayToBase64 } from '@ai-sdk/provider-utils';
import { FileServiceDownloadProcessor } from './file';
import { extractDocumentText } from '../utils/documentParser';
import { clearDocumentParseCache } from '../utils/documentCache';

jest.mock('@ai-sdk/provider-utils', () => ({
  convertUint8ArrayToBase64: jest.fn().mockReturnValue('base64-data'),
}));

jest.mock('../utils/documentParser', () => ({
  isExtractableDocument: jest.fn((mime: string) => mime === 'application/pdf'),
  extractDocumentText: jest.fn(),
}));

const mockGetFileAndMetadata = jest.fn();
const mockGetFileTypeInfo = jest.fn().mockResolvedValue(null);

jest.mock('../clients', () => ({
  createFileServiceClient: jest.fn(() => ({
    getFileAndMetadata: mockGetFileAndMetadata,
    getFileTypeInfo: mockGetFileTypeInfo,
  })),
}));

const logger = { info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() };
const directory = {};
const tokenProvider = {};
const fileUrn = 'urn:ads:platform:file-service:v1:/files/file-123';
const tenantId = AdspId.parse('urn:ads:platform:tenant-service:v2:/tenants/test');

function requestContext(agentId: string) {
  const store = new Map<string, unknown>([
    ['tenantId', tenantId],
    ['agentId', agentId],
  ]);
  return {
    get: (key: string) => store.get(key),
    set: (key: string, value: unknown) => store.set(key, value),
  };
}

describe('FileServiceDownloadProcessor', () => {
  const extractMock = extractDocumentText as jest.MockedFunction<typeof extractDocumentText>;
  const base64Mock = convertUint8ArrayToBase64 as jest.MockedFunction<typeof convertUint8ArrayToBase64>;

  beforeEach(() => {
    jest.clearAllMocks();
    clearDocumentParseCache();
    mockGetFileAndMetadata.mockResolvedValue({
      data: new Uint8Array([1, 2, 3]),
      metadata: {
        filename: 'survey.pdf',
        mimeType: 'application/pdf',
        urn: fileUrn,
        typeName: 'agent-attachments',
      },
    });
  });

  it('does not base64 the extractable download path', async () => {
    extractMock.mockResolvedValue({ text: 'short form', pageCount: 1 });
    const processor = new FileServiceDownloadProcessor(logger as never, directory as never, tokenProvider as never);

    await processor.processInput(requestContext('pdfFormAnalysisAgent') as never, {
      role: 'user',
      content: [{ type: 'file', data: fileUrn, mimeType: 'application/pdf' }],
    });

    expect(base64Mock).not.toHaveBeenCalled();
  });

  it('inlines extracted text for non-form agents', async () => {
    extractMock.mockResolvedValue({
      text: 'short form',
      pageCount: 1,
      pageImages: [{ data: 'img', mimeType: 'image/png' }],
    });
    const processor = new FileServiceDownloadProcessor(logger as never, directory as never, tokenProvider as never);

    const result = await processor.processInput(requestContext('pdfFormAnalysisAgent') as never, {
      role: 'user',
      content: [{ type: 'file', data: fileUrn, mimeType: 'application/pdf' }],
    });
    const message = Array.isArray(result) ? result[0] : result;

    expect((message.content as Array<{ type: string }>).some((part) => part.type === 'image')).toBe(true);
    expect(JSON.stringify(message.content)).toContain('Extracted text content');
  });

  it('injects a page outline for a large formGenerationAgent document', async () => {
    const longText = 'x'.repeat(8000);
    extractMock.mockResolvedValue({
      text: longText,
      pageCount: 6,
      pages: [{ num: 1, text: 'About your team' }],
      pageImages: [{ data: 'img', mimeType: 'image/png' }],
    });
    const processor = new FileServiceDownloadProcessor(logger as never, directory as never, tokenProvider as never);

    const result = await processor.processInput(requestContext('formGenerationAgent') as never, {
      role: 'user',
      content: [{ type: 'file', data: fileUrn, mimeType: 'application/pdf' }],
    });
    const message = Array.isArray(result) ? result[0] : result;
    const text = (message.content as Array<{ type: string; text?: string }>).map((part) => part.text).join('\n');

    expect(text).toContain('page-1');
    expect((message.content as Array<{ type: string }>).some((part) => part.type === 'image')).toBe(false);
  });
});
