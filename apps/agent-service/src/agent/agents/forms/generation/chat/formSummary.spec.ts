import { describeFormForModel } from './formSummary';

const dataSchema = {
  type: 'object',
  properties: {
    applicantName: { type: 'string', minLength: 1 },
    maritalStatus: { type: 'string', enum: ['Single', 'Married'] },
    spouseName: { type: 'string' },
    mailingAddress: { $ref: 'https://adsp.alberta.ca/common.v1.schema.json#/definitions/postalAddressAlberta' },
    totalCost: { type: 'string', format: 'computed', description: '#/properties/a + #/properties/b' },
    notes: { type: 'string' },
  },
  required: ['applicantName'],
  allOf: [
    {
      if: { properties: { maritalStatus: { const: 'Married' } } },
      then: { required: ['spouseName'] },
    },
  ],
};

const uiSchema = {
  type: 'Categorization',
  options: { variant: 'pages' },
  elements: [
    {
      type: 'Category',
      label: 'Applicant',
      elements: [
        { type: 'Control', scope: '#/properties/applicantName', label: 'Applicant name' },
        { type: 'Control', scope: '#/properties/maritalStatus', label: 'Marital status' },
        {
          type: 'Control',
          scope: '#/properties/spouseName',
          label: 'Spouse name',
          rule: { effect: 'SHOW', condition: { scope: '#/properties/maritalStatus', schema: { const: 'Married' } } },
        },
        { type: 'HelpContent', options: { markdown: true, help: 'Enter your legal name.' } },
      ],
    },
    {
      type: 'Category',
      label: 'Costs',
      elements: [
        { type: 'Control', scope: '#/properties/mailingAddress', label: 'Mailing address' },
        { type: 'Control', scope: '#/properties/totalCost', label: 'Total cost' },
      ],
    },
  ],
};

describe('describeFormForModel', () => {
  const summary = describeFormForModel(dataSchema, uiSchema);

  it('describes an empty form as empty', () => {
    // Act
    const empty = describeFormForModel({ type: 'object', properties: {} }, { type: 'VerticalLayout', elements: [] });

    // Assert
    expect(empty).toBe('The form is empty: it has no fields yet.');
  });

  it('lists each page with its UI pointer', () => {
    expect(summary).toContain('Layout: Categorization (variant pages)');
    expect(summary).toContain('Page 1 "Costs" (ui /elements/1):');
  });

  it('lists a field with its label, type, required status and UI pointer', () => {
    expect(summary).toContain(
      '- applicantName "Applicant name": string, minLength 1, required — ui /elements/0/elements/0',
    );
  });

  it('lists enum values with their exact casing', () => {
    expect(summary).toContain('enum "Single" | "Married"');
  });

  it('describes the rule on a control', () => {
    expect(summary).toContain('rule SHOW when maritalStatus = "Married"');
  });

  it('names the common definition a $ref field uses and shows a computed expression', () => {
    expect(summary).toContain('mailingAddress "Mailing address": $ref postalAddressAlberta');
    expect(summary).toContain('totalCost "Total cost": computed = #/properties/a + #/properties/b');
  });

  it('lists conditional requirements, help content and properties without a control', () => {
    expect(summary).toContain('- spouseName when maritalStatus = "Married"');
    expect(summary).toContain('/elements/0/elements/3/options/help');
    expect(summary).toContain('Data properties without a top-level Control: notes');
  });

  it('cuts a long description short and points to formSchemaIndex', () => {
    // Act
    const short = describeFormForModel(dataSchema, uiSchema, 200);

    // Assert
    expect(short.length).toBeLessThan(400);
    expect(short).toContain('Call formSchemaIndex for the full index.');
  });
});
