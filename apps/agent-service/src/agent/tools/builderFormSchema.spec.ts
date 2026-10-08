import { createBuilderFormSchemaTools } from './builderFormSchema';

// The tools take no request context, so an empty one satisfies the executor signature.
const ctx = {} as never;

const dataSchema = {
  type: 'object',
  required: ['where'],
  properties: {
    where: { type: 'string', title: 'Where did it happen?' },
    when: { type: 'string', format: 'date' },
  },
};

const uiSchema = {
  type: 'VerticalLayout',
  elements: [
    { type: 'Control', scope: '#/properties/where' },
    { type: 'Control', scope: '#/properties/when' },
  ],
};

describe('createBuilderFormSchemaTools', () => {
  const { builderFormSchemaValidate, formExamplesTool } = createBuilderFormSchemaTools();

  describe('builderFormSchemaValidate', () => {
    it('accepts a consistent data schema and ui schema', async () => {
      const result = await builderFormSchemaValidate.execute({ dataSchema, uiSchema }, ctx);

      expect(result).toMatchObject({ ok: true, errors: [] });
      expect(result.counts).toMatchObject({ propertyCount: 2, controlCount: 2 });
    });

    it('reports a Control scope that has no matching property', async () => {
      const result = await builderFormSchemaValidate.execute(
        {
          dataSchema,
          uiSchema: {
            type: 'VerticalLayout',
            elements: [{ type: 'Control', scope: '#/properties/missing' }],
          },
        },
        ctx,
      );

      expect(result.ok).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('reports a data schema that is not valid JSON Schema', async () => {
      const result = await builderFormSchemaValidate.execute(
        { dataSchema: { type: 'not-a-type' }, uiSchema: { type: 'VerticalLayout', elements: [] } },
        ctx,
      );

      expect(result.ok).toBe(false);
    });
  });

  describe('formExamplesTool', () => {
    it('returns examples for the requested groups', async () => {
      const result = await formExamplesTool.execute({ groups: ['controls'] }, ctx);

      expect(result.examples).toContain('UI Control Examples');
      expect(result.examples).not.toContain('Rule Examples');
    });

    it('rejects an unknown group', async () => {
      const parsed = formExamplesTool.inputSchema?.safeParse({ groups: ['nope'] });

      expect(parsed?.success).toBe(false);
    });
  });
});
