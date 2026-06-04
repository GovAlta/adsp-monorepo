import { createListNxAdspTemplatesTool, createGetNxAdspTemplateTool } from './nxAdspTemplates';

describe('createListNxAdspTemplatesTool', () => {
  const tool = createListNxAdspTemplatesTool();

  it('creates a tool with the correct id', () => {
    expect(tool.id).toBe('list-nx-adsp-templates');
  });

  it('returns all available templates', async () => {
    const result = await tool.execute({} as never, {} as never);
    expect(result.templates.length).toBeGreaterThan(0);
  });

  it('returns templates with required fields', async () => {
    const result = await tool.execute({} as never, {} as never);
    for (const template of result.templates) {
      expect(template.id).toBeTruthy();
      expect(template.description).toBeTruthy();
      expect(template.compatibleWith).toBeTruthy();
    }
  });

  it('includes express-service-roles and express-service-events templates', async () => {
    const result = await tool.execute({} as never, {} as never);
    const ids = result.templates.map((t) => t.id);
    expect(ids).toContain('express-service-roles');
    expect(ids).toContain('express-service-events');
  });
});

describe('createGetNxAdspTemplateTool', () => {
  const tool = createGetNxAdspTemplateTool();

  it('creates a tool with the correct id', () => {
    expect(tool.id).toBe('get-nx-adsp-template');
  });

  it('returns null for an unknown template id', async () => {
    const result = await tool.execute({ templateId: 'unknown-template' } as never, {} as never);
    expect(result.template).toBeNull();
  });

  it('returns the express-service-roles template with integration changes', async () => {
    const result = await tool.execute({ templateId: 'express-service-roles' } as never, {} as never);
    expect(result.template).not.toBeNull();
    expect(result.template?.id).toBe('express-service-roles');
    expect(result.template?.integrationChanges['src/main.ts']).toBeDefined();
  });

  it('returns the express-service-events template with new files', async () => {
    const result = await tool.execute({ templateId: 'express-service-events' } as never, {} as never);
    expect(result.template).not.toBeNull();
    expect(result.template?.newFiles?.['src/events.ts']).toBeDefined();
    expect(result.template?.integrationChanges['src/main.ts']).toBeDefined();
  });

  it('returns templates compatible with the expected plugin version', async () => {
    const result = await tool.execute({ templateId: 'express-service-roles' } as never, {} as never);
    expect(result.template?.compatibleWith).toContain('12.3.0');
  });
});
