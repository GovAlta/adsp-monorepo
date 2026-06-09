import * as ts from 'typescript';
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

  it('lists all expected backend and frontend templates', async () => {
    const result = await tool.execute({} as never, {} as never);
    const ids = result.templates.map((t) => t.id);
    const expected = [
      'express-service-roles',
      'express-service-events',
      'express-service-configuration',
      'express-service-file-types',
      'react-app-roles',
      'react-app-events',
      'react-app-configuration',
      'react-app-file-upload',
      'angular-app-roles',
      'angular-app-events',
      'angular-app-configuration',
      'angular-app-file-upload',
    ];
    for (const id of expected) {
      expect(ids).toContain(id);
    }
  });
});

describe('createGetNxAdspTemplateTool', () => {
  const listTool = createListNxAdspTemplatesTool();
  const getTool = createGetNxAdspTemplateTool();

  it('creates a tool with the correct id', () => {
    expect(getTool.id).toBe('get-nx-adsp-template');
  });

  it('returns null for an unknown template id', async () => {
    const result = await getTool.execute({ templateId: 'unknown-template' } as never, {} as never);
    expect(result.template).toBeNull();
  });

  it('returns the express-service-roles template with integration changes', async () => {
    const result = await getTool.execute({ templateId: 'express-service-roles' } as never, {} as never);
    expect(result.template).not.toBeNull();
    expect(result.template?.id).toBe('express-service-roles');
    expect(result.template?.integrationChanges['src/main.ts']).toBeDefined();
  });

  it('returns the express-service-events template with new files', async () => {
    const result = await getTool.execute({ templateId: 'express-service-events' } as never, {} as never);
    expect(result.template).not.toBeNull();
    expect(result.template?.newFiles?.['src/events.ts']).toBeDefined();
    expect(result.template?.integrationChanges['src/main.ts']).toBeDefined();
  });

  it('returns templates compatible with the expected plugin version', async () => {
    const result = await getTool.execute({ templateId: 'express-service-roles' } as never, {} as never);
    expect(result.template?.compatibleWith).toContain('12.3.0');
  });

  it('newFiles content is syntactically valid TypeScript after placeholder substitution', async () => {
    const { templates } = await listTool.execute({} as never, {} as never);
    for (const { id } of templates) {
      const { template } = await getTool.execute({ templateId: id } as never, {} as never);
      for (const [path, rawContent] of Object.entries(template?.newFiles ?? {})) {
        // Replace {placeholder} tokens with a valid identifier before parsing.
        // Template placeholders are always simple identifiers ({projectName}, {entity-name}
        // etc.) — use a tight pattern to avoid consuming TypeScript object literals.
        const content = (rawContent as string).replace(/\{[a-zA-Z][a-zA-Z0-9-]*\}/g, 'TestValue');
        const source = ts.createSourceFile(path, content, ts.ScriptTarget.Latest, true);
        // parseDiagnostics is internal but present on the SourceFile — cast to access it
        const diagnostics = (source as unknown as { parseDiagnostics?: ts.Diagnostic[] }).parseDiagnostics ?? [];
        expect({ id, path, diagnostics: diagnostics.map((d) => d.messageText) }).toMatchObject({
          id,
          path,
          diagnostics: [],
        });
      }
    }
  });

  it('integration patterns do not unconditionally destructure capabilities-only members', async () => {
    // eventService and tokenProvider should only appear in patterns when the agent
    // is explicitly writing route handlers that use them — not as unconditional destructures
    // that would produce TS6133 unused-variable errors.
    const capabilityMembers = ['eventService', 'tokenProvider'];
    const unconditionalDestructure = (member: string) =>
      new RegExp(`const\\s*\\{[^}]*\\b${member}\\b`);

    const { templates } = await listTool.execute({} as never, {} as never);
    for (const { id } of templates) {
      const { template } = await getTool.execute({ templateId: id } as never, {} as never);
      for (const [file, change] of Object.entries(template?.integrationChanges ?? {})) {
        const { pattern } = change as { description: string; pattern: string };
        for (const member of capabilityMembers) {
          expect({ id, file, member, match: unconditionalDestructure(member).test(pattern) }).toMatchObject({
            id,
            file,
            member,
            match: false,
          });
        }
      }
    }
  });

  it('express-service-configuration integration pattern does not import type alongside schema', async () => {
    // The configuration type ({ServiceName}Configuration) should not be in the main.ts
    // integration import — it causes TS6133 if the agent does not also write a route handler.
    const { template } = await getTool.execute(
      { templateId: 'express-service-configuration' } as never,
      {} as never
    );
    const pattern = template?.integrationChanges['src/main.ts']?.pattern ?? '';
    // Only configurationSchema should appear in the import statement
    expect(pattern).toContain('configurationSchema');
    expect(pattern).not.toMatch(/import\s*\{[^}]*Configuration[^}]*\}/);
  });

  it('enableConfigurationInvalidation is described as belonging to the first initializeService argument', async () => {
    const { template } = await getTool.execute(
      { templateId: 'express-service-configuration' } as never,
      {} as never
    );
    const pattern = template?.integrationChanges['src/main.ts']?.pattern ?? '';
    expect(pattern).toContain('FIRST argument');
  });
});
