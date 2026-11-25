import { createSchemaTools, selectDefinitions } from './schema';

const COMMON = 'https://adsp.alberta.ca/common.v1.schema.json';
const ctx = {} as never;

describe('selectDefinitions', () => {
  const schema = {
    $id: COMMON,
    definitions: {
      person: { type: 'object', properties: { name: { $ref: '#/definitions/name' } } },
      name: { type: 'string', minLength: 1 },
      email: { type: 'string', format: 'email' },
    },
  };

  it('returns the named definitions with the definitions they reference', () => {
    // Act
    const selected = selectDefinitions(schema, ['person']);

    // Assert
    expect(Object.keys(selected.definitions as object)).toEqual(['person', 'name']);
  });

  it('lists the available definitions when a name does not exist', () => {
    // Act
    const selected = selectDefinitions(schema, ['address']);

    // Assert
    expect(selected).toMatchObject({ missing: ['address'], available: ['person', 'name', 'email'] });
  });
});

describe('schemaDefinitionTool', () => {
  it('returns only the requested common definitions', async () => {
    // Arrange
    const { schemaDefinitionTool } = await createSchemaTools();

    // Act
    const { jsonSchema } = await schemaDefinitionTool.execute(
      { url: COMMON, definitions: ['postalAddressAlberta'] },
      ctx,
    );

    // Assert
    expect(Object.keys(jsonSchema.definitions as object)).toContain('postalAddressAlberta');
    expect(Object.keys(jsonSchema.definitions as object)).not.toContain('bankAccountNumber');
  });

  it('reads the definition name from a URL fragment', async () => {
    // Arrange
    const { schemaDefinitionTool } = await createSchemaTools();

    // Act
    const { jsonSchema } = await schemaDefinitionTool.execute({ url: `${COMMON}#/definitions/email` }, ctx);

    // Assert
    expect(Object.keys(jsonSchema.definitions as object)).toEqual(['email']);
  });

  it('returns the whole schema file without definition names', async () => {
    // Arrange
    const { schemaDefinitionTool } = await createSchemaTools();

    // Act
    const { jsonSchema } = await schemaDefinitionTool.execute({ url: COMMON }, ctx);

    // Assert
    expect(jsonSchema.$id).toBe(COMMON);
    expect(Object.keys(jsonSchema.definitions as object).length).toBeGreaterThan(5);
  });
});
