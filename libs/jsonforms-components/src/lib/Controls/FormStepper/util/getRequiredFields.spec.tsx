import { getAllRequiredFields } from './getRequiredFields';

describe('getAllRequiredFields', () => {
  it('returns an array of required fields from a given schema', () => {
    const schema = {
      type: 'object',
      properties: {
        firstName: {
          type: 'string',
          minLength: 3,
          description: 'Please enter your first name',
        },
        nationality: {
          type: 'string',
          enum: ['DE', 'IT', 'JP', 'US', 'RU', 'Other'],
        },
        dependant: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              'first-name': {
                type: 'string',
              },
            },
            required: ['first-name'],
          },
        },
      },
      required: ['firstName', 'nationality'],
    };

    const requiredFields = getAllRequiredFields(schema);
    expect(requiredFields).toEqual(expect.arrayContaining(['firstName', 'nationality', 'first-name']));
    expect(requiredFields).toHaveLength(3);
  });
  it('should return an empty array if no required fields', () => {
    const schema = {
      type: 'object',
      properties: {
        firstName: {
          type: 'string',
          minLength: 3,
          description: 'Please enter your first name',
        },
        nationality: {
          type: 'string',
          enum: ['DE', 'IT', 'JP', 'US', 'RU', 'Other'],
        },
        dependant: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              'first-name': {
                type: 'string',
              },
            },
          },
        },
      },
    };

    const requiredFields = getAllRequiredFields(schema);
    expect(requiredFields).toEqual(expect.arrayContaining([]));
    expect(requiredFields).toHaveLength(0);
  });
});
