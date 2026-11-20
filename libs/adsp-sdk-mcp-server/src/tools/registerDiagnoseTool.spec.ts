import { join } from 'path';
import { ApiSpecsRepository } from '../api-specs/apiSpecsRepository';
import { createDiagnoseTool } from './registerDiagnoseTool';

const FIXTURE_ROOT = join(__dirname, '../fixtures/api-specs');

function toolWith(loadApis: () => ApiSpecsRepository) {
  const [tool] = createDiagnoseTool(loadApis);
  return tool;
}

const textOf = (result: { content: unknown[] }) => (result.content[0] as { text: string }).text;

describe('diagnose_adsp_error', () => {
  const tool = toolWith(() => new ApiSpecsRepository(FIXTURE_ROOT));

  it('is an offline tool taking a symptom', () => {
    expect(tool.name).toBe('diagnose_adsp_error');
    expect(tool.annotations).toEqual({ readOnlyHint: true, openWorldHint: false });
    expect(tool.inputSchema.required).toEqual(['symptom']);
  });

  it('returns diagnoses as JSON for a known symptom', async () => {
    const result = await tool.handler({ symptom: '401 calling demo-service' });
    const { diagnoses } = JSON.parse(textOf(result));

    expect(result.isError).toBeUndefined();
    expect(diagnoses[0]).toMatchObject({ id: 'service-call-401', match: 'strong' });
    expect(JSON.stringify(diagnoses[0].causes)).toContain('urn:ads:platform:demo-service');
  });

  it('returns the no-match text for an unknown symptom', async () => {
    const result = await tool.handler({ symptom: 'kubernetes pod crashloop' });
    const text = textOf(result);

    expect(result.isError).toBeUndefined();
    expect(text).toContain('search_adsp_docs');
    for (const name of ['401', '403', 'getConfiguration', 'req.tenant', 'directory', 'access token']) {
      expect(text).toContain(name);
    }
  });

  it.each([{}, { symptom: '' }, { symptom: '   ' }])('rejects an empty symptom: %j', async (args) => {
    const result = await tool.handler(args);

    expect(result.isError).toBe(true);
    expect(textOf(result)).toContain('symptom');
  });

  it('answers when the API index is missing', async () => {
    const missing = toolWith(() => {
      throw Object.assign(new Error('no index'), { code: 'ENOENT' });
    });

    const result = await missing.handler({ symptom: '401 calling urn:ads:platform:file-service' });

    expect(JSON.stringify(JSON.parse(textOf(result)).diagnoses[0].causes)).toContain('urn:ads:platform:file-service');
  });

  it('rethrows other index errors', async () => {
    const broken = toolWith(() => {
      throw new SyntaxError('bad index');
    });

    await expect(async () => broken.handler({ symptom: '401 calling file-service' })).rejects.toThrow('bad index');
  });
});
