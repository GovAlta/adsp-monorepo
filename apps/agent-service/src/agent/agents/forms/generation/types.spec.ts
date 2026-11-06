import { z } from 'zod';
import { categoryIncrementSchema } from './types';

describe('categoryIncrementSchema', () => {
  it('accepts properties keyed by name and keeps unknown keywords', () => {
    const result = categoryIncrementSchema.parse({
      dataSchemaProperties: { firstName: { type: 'string', maxLength: 20 } },
    });

    expect(result.dataSchemaProperties).toEqual({ firstName: { type: 'string', maxLength: 20 } });
  });

  it('allows dataSchemaProperties to be omitted', () => {
    expect(categoryIncrementSchema.safeParse({}).success).toBe(true);
  });

  it('rejects property definitions that are not objects', () => {
    expect(categoryIncrementSchema.safeParse({ dataSchemaProperties: { firstName: 'string' } }).success).toBe(false);
  });

  it('exposes dataSchemaProperties as a string-keyed object in JSON Schema', () => {
    const { properties } = z.toJSONSchema(categoryIncrementSchema) as {
      properties: Record<string, { type?: string; additionalProperties?: { type?: string }; description?: string }>;
    };

    expect(properties.dataSchemaProperties.type).toBe('object');
    expect(properties.dataSchemaProperties.additionalProperties?.type).toBe('object');
    expect(properties.dataSchemaProperties.description).toContain('keyed by property name');
  });
});
