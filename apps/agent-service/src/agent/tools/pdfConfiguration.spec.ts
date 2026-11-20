import { createPdfConfigurationTools, unwrapDataVariables } from './pdfConfiguration';
import axios from 'axios';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

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
  getServiceUrl: jest.fn().mockResolvedValue(new URL('https://config-service.test/')),
};

const mockRequestContext = {
  get: jest.fn((key: string) => {
    if (key === 'tenantId') return { toString: () => 'test-tenant-id' };
    if (key === 'pdfDefinitionId') return 'test-template';
    return undefined;
  }),
};

const savedConfiguration = {
  name: 'Test template',
  description: 'A test template',
  template: '<p>Old body</p>',
  header: '<div>Default GoA header</div>',
  footer: '<div>Default GoA footer</div>',
  additionalStyles: 'p { color: red; }',
  variables: '{"old": true}',
};

describe('createPdfConfigurationTools', () => {
  let tools: Awaited<ReturnType<typeof createPdfConfigurationTools>>;

  beforeAll(async () => {
    tools = await createPdfConfigurationTools({
      directory: mockDirectory as never,
      tokenProvider: mockTokenProvider as never,
      logger: mockLogger as never,
    });
  });

  beforeEach(() => {
    jest.clearAllMocks();
    mockTokenProvider.getAccessToken.mockResolvedValue('test-token');
    mockedAxios.get.mockResolvedValue({
      data: { latest: { configuration: { 'test-template': { ...savedConfiguration } } } },
    });
    mockedAxios.patch.mockImplementation((_url, body) =>
      Promise.resolve({
        status: 200,
        data: { latest: { configuration: (body as { update: Record<string, object> }).update } },
      }),
    );
  });

  it('creates both pdf configuration tools', () => {
    expect(tools.pdfConfigurationRetrievalTool).toBeDefined();
    expect(tools.pdfConfigurationUpdateTool).toBeDefined();
  });

  describe('pdfConfigurationRetrievalTool', () => {
    it('retrieves the pdf configuration for the definition in request context', async () => {
      const result = await tools.pdfConfigurationRetrievalTool.execute({}, {
        requestContext: mockRequestContext,
      } as never);

      expect(result.name).toBe('Test template');
      expect(result.header).toBe('<div>Default GoA header</div>');
    });
  });

  describe('pdfConfigurationUpdateTool', () => {
    const getPatchedTemplate = () => {
      const body = mockedAxios.patch.mock.calls[0][1] as { update: Record<string, Record<string, unknown>> };
      return body.update['test-template'];
    };

    it('updates provided fields and keeps omitted fields unchanged', async () => {
      await tools.pdfConfigurationUpdateTool.execute({ template: '<p>New body</p>' }, {
        requestContext: mockRequestContext,
      } as never);

      const patched = getPatchedTemplate();
      expect(patched.template).toBe('<p>New body</p>');
      expect(patched.header).toBe('<div>Default GoA header</div>');
      expect(patched.footer).toBe('<div>Default GoA footer</div>');
    });

    it('replaces header and footer when provided', async () => {
      await tools.pdfConfigurationUpdateTool.execute(
        { header: '<div>New header</div>', footer: '<div>New footer</div>' },
        { requestContext: mockRequestContext } as never,
      );

      const patched = getPatchedTemplate();
      expect(patched.header).toBe('<div>New header</div>');
      expect(patched.footer).toBe('<div>New footer</div>');
    });

    it('rejects a template with invalid Handlebars syntax without saving', async () => {
      await expect(
        tools.pdfConfigurationUpdateTool.execute(
          // Unclosed mustache expression — the parser cannot tokenize this
          { template: '<h1>{{data.title</h1><p>Cascade Outfitters — Spring 2025</p>' },
          { requestContext: mockRequestContext } as never,
        ),
      ).rejects.toThrow(/Configuration was NOT saved[\s\S]*template:/);

      expect(mockedAxios.patch).not.toHaveBeenCalled();
    });

    it.each(['header', 'footer'])('rejects invalid Handlebars syntax in %s without saving', async (field) => {
      const execute = () =>
        tools.pdfConfigurationUpdateTool.execute({ [field]: '<div>{{data.name</div>' }, {
          requestContext: mockRequestContext,
        } as never);

      await expect(execute()).rejects.toThrow(new RegExp(`Configuration was NOT saved[\\s\\S]*${field}:`));

      expect(mockedAxios.patch).not.toHaveBeenCalled();
    });

    it('returns the saved template with its id set', async () => {
      // The webapp saga merges the tool result into the store keyed by this id.
      const result = await tools.pdfConfigurationUpdateTool.execute({ template: '<p>New body</p>' }, {
        requestContext: mockRequestContext,
      } as never);

      expect(result.id).toBe('test-template');
      expect(result.template).toBe('<p>New body</p>');
    });

    it('rejects invalid JSON in variables without saving', async () => {
      await expect(
        tools.pdfConfigurationUpdateTool.execute(
          { variables: '{"items": [}' },
          { requestContext: mockRequestContext } as never,
        ),
      ).rejects.toThrow(/variables is not valid JSON/);

      expect(mockedAxios.patch).not.toHaveBeenCalled();
    });

    it('accepts valid Handlebars expressions and helpers', async () => {
      await tools.pdfConfigurationUpdateTool.execute(
        {
          template: '<h1>{{data.title}}</h1>{{#each data.items}}<p>{{this.name}}</p>{{/each}}',
          variables: '{"title": "Catalog", "items": []}',
        },
        { requestContext: mockRequestContext } as never,
      );

      expect(mockedAxios.patch).toHaveBeenCalled();
    });

    it('clears fields when empty strings are provided', async () => {
      await tools.pdfConfigurationUpdateTool.execute(
        { header: '', footer: '', additionalStyles: '' },
        { requestContext: mockRequestContext } as never,
      );

      const patched = getPatchedTemplate();
      expect(patched.header).toBe('');
      expect(patched.footer).toBe('');
      expect(patched.additionalStyles).toBe('');
    });

    describe('with long data URIs and comments', () => {
      const logo = `data:image/svg+xml,${'%3Cpath/%3E'.repeat(30)}`;
      const note = ` ${'Puppeteer sets the footer height from the page margins. '.repeat(5)}`;

      beforeEach(() => {
        mockedAxios.get.mockResolvedValue({
          data: {
            latest: {
              configuration: {
                'test-template': {
                  ...savedConfiguration,
                  footer: `<!--${note}--><img src="${logo}"> Page <span class="pageNumber"></span>`,
                },
              },
            },
          },
        });
      });

      it('puts back the content of the placeholders the agent copied', async () => {
        await tools.pdfConfigurationUpdateTool.execute(
          {
            footer:
              '<!--[[elided-comment-1]]--><img src="[[elided-asset-2]]"> {{data.name}} - Page <span class="pageNumber"></span>',
          },
          { requestContext: mockRequestContext } as never,
        );

        expect(getPatchedTemplate().footer).toBe(
          `<!--${note}--><img src="${logo}"> {{data.name}} - Page <span class="pageNumber"></span>`,
        );
      });

      it('rejects a placeholder that stands for nothing without saving', async () => {
        await expect(
          tools.pdfConfigurationUpdateTool.execute({ footer: '<img src="[[elided-asset-9]]">' }, {
            requestContext: mockRequestContext,
          } as never),
        ).rejects.toThrow(/Configuration was NOT saved[\s\S]*\[\[elided-asset-9\]\] does not stand for anything/);

        expect(mockedAxios.patch).not.toHaveBeenCalled();
      });

      it('shows the model the template with placeholders', () => {
        const output = tools.pdfConfigurationRetrievalTool.toModelOutput?.({
          ...savedConfiguration,
          footer: `<img src="${logo}">`,
        } as never) as { type: string; value: string };

        expect(output.type).toBe('text');
        expect(output.value).toContain('=== footer ===\n<img src="[[elided-asset-1]]">');
        expect(output.value).not.toContain('%3Cpath');
      });
    });

    it('tells the model only that the save worked; the editor reads the full result from the stream', () => {
      const output = tools.pdfConfigurationUpdateTool.toModelOutput?.({
        ...savedConfiguration,
        id: 'test-template',
      } as never);

      expect(output).toEqual({ type: 'text', value: 'Saved. The editor now shows the updated template.' });
    });

    it('saves variables wrapped in a data object at the root, where the template reads them', async () => {
      await tools.pdfConfigurationUpdateTool.execute(
        { template: '<p>{{data.applicant}}</p>', variables: '{"data": {"applicant": "Jane"}}' },
        { requestContext: mockRequestContext } as never,
      );

      expect(JSON.parse(getPatchedTemplate().variables as string)).toEqual({ applicant: 'Jane' });
    });
  });
});

describe('unwrapDataVariables', () => {
  it('keeps root-level variables, invalid JSON and a data variable the template reads', () => {
    expect(unwrapDataVariables('{"data": {"a": 1}, "b": 2}', [''])).toBe('{"data": {"a": 1}, "b": 2}');
    expect(unwrapDataVariables('{"data": [1]}', [''])).toBe('{"data": [1]}');
    expect(unwrapDataVariables('{"data": {', [''])).toBe('{"data": {');
    expect(unwrapDataVariables('{"data": {"a": 1}}', ['{{data.data.a}}'])).toBe('{"data": {"a": 1}}');
    expect(unwrapDataVariables(undefined, [''])).toBeUndefined();
  });
});
