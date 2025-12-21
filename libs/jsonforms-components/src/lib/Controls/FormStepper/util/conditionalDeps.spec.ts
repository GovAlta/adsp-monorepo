import { buildConditionalDeps } from '../util/conditionalDeps';

function mapToSortedObject(m: Map<string, string[]>) {
  const obj: Record<string, string[]> = {};
  for (const [k, v] of m.entries()) {
    obj[k] = [...v].sort();
  }
  // sort keys for stable snapshot-like compares
  return Object.fromEntries(Object.entries(obj).sort(([a], [b]) => a.localeCompare(b)));
}

describe('buildConditionalDeps', () => {
  it('returns empty map when schema is not an object', () => {
    expect(mapToSortedObject(buildConditionalDeps(null))).toEqual({});
    expect(mapToSortedObject(buildConditionalDeps(undefined))).toEqual({});
    expect(mapToSortedObject(buildConditionalDeps(true))).toEqual({});
    expect(mapToSortedObject(buildConditionalDeps('x'))).toEqual({});
  });

  it('collects controllers from if.properties keys', () => {
    const schema = {
      allOf: [
        {
          if: {
            properties: {
              fillingApplicationOnbehalf: { const: 'No' },
            },
          },
          then: {
            required: ['applicantContactDetails'],
          },
        },
      ],
    };

    const deps = buildConditionalDeps(schema);
    expect(mapToSortedObject(deps)).toEqual({
      fillingApplicationOnbehalf: ['applicantContactDetails'],
    });
  });

  it('collects controllers from if.required array too', () => {
    const schema = {
      if: {
        required: ['controllerA', 'controllerB'],
      },
      then: {
        required: ['x'],
      },
    };

    const deps = buildConditionalDeps(schema);
    expect(mapToSortedObject(deps)).toEqual({
      controllerA: ['x'],
      controllerB: ['x'],
    });
  });

  it('affected paths include nested required fields via properties recursion', () => {
    const schema = {
      if: {
        properties: {
          fillingApplicationOnbehalf: { enum: ['No'] },
        },
      },
      then: {
        properties: {
          applicantContactDetails: {
            required: ['firstName', 'lastName'],
            properties: {
              applicantMailAddress: {
                required: ['addressLine1', 'postalCodeZip'],
                properties: {
                  addressLine1: { type: 'string' },
                  postalCodeZip: { type: 'string' },
                },
              },
            },
          },
        },
        required: ['applicantContactDetails'],
      },
    };

    const deps = buildConditionalDeps(schema);

    expect(mapToSortedObject(deps)).toEqual({
      fillingApplicationOnbehalf: [
        'applicantContactDetails',
        'applicantContactDetails.applicantMailAddress.addressLine1',
        'applicantContactDetails.applicantMailAddress.postalCodeZip',
        'applicantContactDetails.firstName',
        'applicantContactDetails.lastName',
      ],
    });
  });

  it('includes both then and else required paths as "affected"', () => {
    const schema = {
      if: {
        properties: {
          fillingApplicationOnbehalf: { enum: ['No'] },
        },
      },
      then: {
        required: ['applicantContactDetails'],
        properties: {
          applicantContactDetails: {
            required: ['firstName'],
          },
        },
      },
      else: {
        required: ['representativeContactInformation'],
        properties: {
          representativeContactInformation: {
            required: ['primaryEmail'],
          },
        },
      },
    };

    const deps = buildConditionalDeps(schema);
    expect(mapToSortedObject(deps)).toEqual({
      fillingApplicationOnbehalf: [
        'applicantContactDetails',
        'applicantContactDetails.firstName',
        'representativeContactInformation',
        'representativeContactInformation.primaryEmail',
      ],
    });
  });

  it('merges affected paths across multiple conditionals for same controller key', () => {
    const schema = {
      allOf: [
        {
          if: { properties: { a: { const: 1 } } },
          then: { required: ['x'] },
        },
        {
          if: { properties: { a: { const: 2 } } },
          then: { required: ['y'] },
        },
      ],
    };

    const deps = buildConditionalDeps(schema);
    expect(mapToSortedObject(deps)).toEqual({
      a: ['x', 'y'],
    });
  });

  it('walks into allOf/anyOf/oneOf combinators', () => {
    const schema = {
      anyOf: [
        {
          if: { properties: { a: { const: 1 } } },
          then: { required: ['x'] },
        },
        {
          oneOf: [
            {
              if: { properties: { b: { const: true } } },
              then: { required: ['y'] },
            },
          ],
        },
      ],
    };

    const deps = buildConditionalDeps(schema);
    expect(mapToSortedObject(deps)).toEqual({
      a: ['x'],
      b: ['y'],
    });
  });

  it('also walks nested node.properties (deep traversal)', () => {
    const schema = {
      properties: {
        outer: {
          properties: {
            inner: {
              if: { properties: { c: { const: 'yes' } } },
              then: { required: ['z'] },
            },
          },
        },
      },
    };

    const deps = buildConditionalDeps(schema);
    expect(mapToSortedObject(deps)).toEqual({
      c: ['z'],
    });
  });

  it('ignores if blocks that have no then/else', () => {
    const schema = {
      if: { properties: { a: { const: 1 } } },
      // no then/else => should be ignored by implementation
    };

    const deps = buildConditionalDeps(schema);
    expect(mapToSortedObject(deps)).toEqual({});
  });
});
