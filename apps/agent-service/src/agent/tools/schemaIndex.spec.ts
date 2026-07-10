import { createSchemaIndexTools } from './schemaIndex';
import axios from 'axios';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

const mockLogger = {
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn(),
};

const mockTokenProvider = {
  getAccessToken: jest.fn().mockResolvedValue('test-token'),
};

const mockDirectory = {
  getServiceUrl: jest.fn().mockResolvedValue(new URL('https://config-service.test/')),
};

const mockRequestContext = {
  get: jest.fn((key: string) => {
    if (key === 'tenantId') return { toString: () => 'test-tenant' };
    if (key === 'formDefinitionId') return 'intake-form';
    return undefined;
  }),
};

// ---- Shared test schemas -----------------------------------------------

const categorizationDataSchema = {
  type: 'object',
  required: ['firstName', 'lastName'],
  properties: {
    firstName: { type: 'string' },
    lastName: { type: 'string' },
    birthDate: { type: 'string' },
    address: { $ref: 'https://adsp.alberta.ca/common.v1.schema.json#/definitions/postalAddressAlberta' },
  },
  if: { properties: { birthDate: { const: 'Y' } } },
  then: { required: ['firstName'] },
};

const categorizationUiSchema = {
  type: 'Categorization',
  elements: [
    {
      type: 'Category',
      label: 'Personal',
      elements: [
        {
          type: 'VerticalLayout',
          elements: [
            { type: 'Control', scope: '#/properties/firstName', label: 'First Name' },
            { type: 'Control', scope: '#/properties/lastName', label: 'Last Name' },
            {
              type: 'Control',
              scope: '#/properties/birthDate',
              label: 'Birth Date',
              rule: {
                effect: 'HIDE',
                condition: { scope: '#/properties/firstName', schema: { const: 'hide' } },
              },
            },
            { type: 'Control', scope: '#/properties/address', label: 'Address' },
          ],
        },
        {
          type: 'HelpContent',
          label: 'Instructions',
          options: { help: 'Fill in your personal details.', markdown: true },
        },
        {
          type: 'HelpContent',
          options: { variant: 'details', help: '' }, // empty wrapper — must be skipped
        },
      ],
    },
    {
      type: 'Category',
      label: 'Summary',
      elements: [],
    },
  ],
};

const flatDataSchema = {
  type: 'object',
  required: ['email'],
  properties: {
    email: { type: 'string' },
    phone: { type: 'string' },
  },
};

const flatUiSchema = {
  type: 'VerticalLayout',
  elements: [
    { type: 'Control', scope: '#/properties/email', label: 'Email' },
    { type: 'Control', scope: '#/properties/phone', label: 'Phone' },
  ],
};

const allOfDataSchema = {
  type: 'object',
  properties: {
    status: { type: 'string' },
    reason: { type: 'string' },
    notes: { type: 'string' },
  },
  allOf: [
    {
      if: { properties: { status: { const: 'Denied' } } },
      then: { required: ['reason'] },
    },
    {
      if: { properties: { status: { const: 'Other' } } },
      then: { required: ['notes'] },
    },
  ],
};

// ---- Helpers -----------------------------------------------------------

function mockFormResponse(dataSchema: unknown, uiSchema: unknown) {
  mockedAxios.get.mockResolvedValueOnce({ data: { dataSchema, uiSchema } });
}

const ctx = { requestContext: mockRequestContext } as never;

// ---- Tests -------------------------------------------------------------

describe('createSchemaIndexTools', () => {
  let tools: Awaited<ReturnType<typeof createSchemaIndexTools>>;

  beforeAll(async () => {
    tools = await createSchemaIndexTools({
      directory: mockDirectory as never,
      tokenProvider: mockTokenProvider as never,
      logger: mockLogger as never,
    });
  });

  afterEach(() => jest.clearAllMocks());

  it('creates the formSchemaIndex tool', () => {
    expect(tools.formSchemaIndex).toBeDefined();
  });

  it('fetches the form definition using formDefinitionId from request context', async () => {
    mockFormResponse(flatDataSchema, flatUiSchema);
    await tools.formSchemaIndex.execute({}, ctx);
    const url = mockedAxios.get.mock.calls[0][0] as string;
    expect(url).toContain('form-service/intake-form/latest');
  });

  describe('Categorization layout', () => {
    it('returns one CategoryEntry per Category element', async () => {
      mockFormResponse(categorizationDataSchema, categorizationUiSchema);
      const result = await tools.formSchemaIndex.execute({}, ctx);
      expect(result.rootType).toBe('Categorization');
      expect(result.categories).toHaveLength(2);
      expect(result.categories[0].label).toBe('Personal');
      expect(result.categories[1].label).toBe('Summary');
    });

    it('maps each Control to the correct category with its uiPointer and label', async () => {
      mockFormResponse(categorizationDataSchema, categorizationUiSchema);
      const result = await tools.formSchemaIndex.execute({}, ctx);
      const personal = result.categories[0];
      expect(personal.controls).toHaveLength(4);
      expect(personal.controls[0].scope).toBe('#/properties/firstName');
      expect(personal.controls[0].label).toBe('First Name');
      expect(personal.controls[0].uiPointer).toBe('/elements/0/elements/0/elements/0');
    });

    it('marks required properties as required: true', async () => {
      mockFormResponse(categorizationDataSchema, categorizationUiSchema);
      const result = await tools.formSchemaIndex.execute({}, ctx);
      expect(result.dataProperties['firstName'].required).toBe(true);
      expect(result.dataProperties['lastName'].required).toBe(true);
    });

    it('marks non-required properties as required: false', async () => {
      mockFormResponse(categorizationDataSchema, categorizationUiSchema);
      const result = await tools.formSchemaIndex.execute({}, ctx);
      expect(result.dataProperties['birthDate'].required).toBe(false);
    });

    it('fills categoryIndex and uiPointer on matched dataProperties', async () => {
      mockFormResponse(categorizationDataSchema, categorizationUiSchema);
      const result = await tools.formSchemaIndex.execute({}, ctx);
      expect(result.dataProperties['firstName'].categoryIndex).toBe(0);
      expect(result.dataProperties['firstName'].uiPointer).toBe('/elements/0/elements/0/elements/0');
    });

    it('collects HIDE rules with trigger scope and target uiPointer', async () => {
      mockFormResponse(categorizationDataSchema, categorizationUiSchema);
      const result = await tools.formSchemaIndex.execute({}, ctx);
      expect(result.rules).toHaveLength(1);
      expect(result.rules[0].effect).toBe('HIDE');
      expect(result.rules[0].triggerScope).toBe('#/properties/firstName');
      expect(result.rules[0].targetUiPointer).toBe('/elements/0/elements/0/elements/2');
    });

    it('indexes HelpContent elements with contentPath pointing to options.help', async () => {
      mockFormResponse(categorizationDataSchema, categorizationUiSchema);
      const result = await tools.formSchemaIndex.execute({}, ctx);
      const helpContents = result.categories[0].helpContents;
      expect(helpContents).toHaveLength(1);
      expect(helpContents[0].label).toBe('Instructions');
      expect(helpContents[0].uiPointer).toBe('/elements/0/elements/1');
      expect(helpContents[0].contentPath).toBe('/elements/0/elements/1/options/help');
    });

    it('skips HelpContent elements with empty options.help', async () => {
      mockFormResponse(categorizationDataSchema, categorizationUiSchema);
      const result = await tools.formSchemaIndex.execute({}, ctx);
      // The second HelpContent (empty help: '') must not appear in the index
      expect(result.categories[0].helpContents).toHaveLength(1);
    });

    it('records $ref properties with type "$ref" without resolving the reference', async () => {
      mockFormResponse(categorizationDataSchema, categorizationUiSchema);
      const result = await tools.formSchemaIndex.execute({}, ctx);
      expect(result.dataProperties['address'].type).toBe('$ref');
    });

    it('exposes topLevelRequired as a flat string array', async () => {
      mockFormResponse(categorizationDataSchema, categorizationUiSchema);
      const result = await tools.formSchemaIndex.execute({}, ctx);
      expect(result.topLevelRequired).toEqual(expect.arrayContaining(['firstName', 'lastName']));
    });
  });

  describe('if/then conditional required', () => {
    it('extracts a top-level if/then block into conditionalRequired', async () => {
      mockFormResponse(categorizationDataSchema, categorizationUiSchema);
      const result = await tools.formSchemaIndex.execute({}, ctx);
      expect(result.conditionalRequired).toHaveLength(1);
      expect(result.conditionalRequired[0].conditionScope).toBe('#/properties/birthDate');
      expect(result.conditionalRequired[0].conditionValue).toBe('Y');
      expect(result.conditionalRequired[0].required).toContain('firstName');
    });

    it('extracts multiple allOf if/then blocks into conditionalRequired', async () => {
      mockFormResponse(allOfDataSchema, flatUiSchema);
      const result = await tools.formSchemaIndex.execute({}, ctx);
      expect(result.conditionalRequired).toHaveLength(2);
      expect(result.conditionalRequired[0].conditionScope).toBe('#/properties/status');
      expect(result.conditionalRequired[0].conditionValue).toBe('Denied');
      expect(result.conditionalRequired[0].required).toContain('reason');
      expect(result.conditionalRequired[1].conditionValue).toBe('Other');
      expect(result.conditionalRequired[1].required).toContain('notes');
    });
  });

  describe('flat VerticalLayout', () => {
    it('treats a flat layout as a single virtual category labelled Form', async () => {
      mockFormResponse(flatDataSchema, flatUiSchema);
      const result = await tools.formSchemaIndex.execute({}, ctx);
      expect(result.rootType).toBe('VerticalLayout');
      expect(result.categories).toHaveLength(1);
      expect(result.categories[0].label).toBe('Form');
      expect(result.categories[0].categoryIndex).toBe(0);
    });

    it('collects all controls from the flat layout', async () => {
      mockFormResponse(flatDataSchema, flatUiSchema);
      const result = await tools.formSchemaIndex.execute({}, ctx);
      expect(result.categories[0].controls).toHaveLength(2);
      expect(result.categories[0].controls[0].scope).toBe('#/properties/email');
    });

    it('marks required and non-required properties correctly in a flat layout', async () => {
      mockFormResponse(flatDataSchema, flatUiSchema);
      const result = await tools.formSchemaIndex.execute({}, ctx);
      expect(result.dataProperties['email'].required).toBe(true);
      expect(result.dataProperties['phone'].required).toBe(false);
    });

    it('returns an empty categories array for a flat layout with no controls', async () => {
      mockFormResponse(
        { type: 'object', properties: {} },
        { type: 'VerticalLayout', elements: [] },
      );
      const result = await tools.formSchemaIndex.execute({}, ctx);
      expect(result.categories).toHaveLength(0);
    });
  });
});
