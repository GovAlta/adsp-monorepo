import { extractNestedFields } from './ObjectListControlUtils';

describe('extractNestedFields', () => {
  it('should skip non-array fields and return empty object for them', () => {
    const inputProperties = {
      name: { type: 'string' },
      email: { type: 'string' },
    };

    const result = extractNestedFields(inputProperties, ['name']);

    expect(result).toEqual({});
  });

  it('should handle missing properties or required fields gracefully', () => {
    const inputProperties = {
      notes: {
        type: 'array',
        items: {
          type: 'object',
          // no properties or required
        },
      },
    };

    const result = extractNestedFields(inputProperties, ['notes']);

    expect(result).toEqual({
      notes: {
        properties: [],
        required: [],
      },
    });
  });
});
