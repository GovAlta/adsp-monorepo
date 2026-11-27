import { ServiceDirectory } from '@abgov/adsp-service-sdk';
import { createTemplateService, getAllRequiredFields } from './handlebars';

const flushPromises = () => new Promise((resolve) => setImmediate(resolve));

describe('handlebars template service', () => {
  const directory = {
    getServiceUrl: jest.fn().mockResolvedValue(new URL('https://file.example/')),
  } as unknown as ServiceDirectory;
  const service = createTemplateService(directory);
  const renderTemplate = (template: string, data: Record<string, unknown>) =>
    service.getTemplateFunction(template)({ data }) as string;
  const textOf = (html: string) =>
    html
      .slice(html.lastIndexOf('}') + 1)
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  const renderElement = (
    element: Record<string, unknown>,
    content: Record<string, unknown>,
    schema: Record<string, unknown> = { type: 'object', properties: {} },
  ) =>
    textOf(
      renderTemplate(
        '{{> elements element=data.element data=data.content dataSchema=data.schema requiredFields=(requiredField data.schema) }}',
        { element, content, schema },
      ),
    );

  describe('form elements', () => {
    it('shows a multiple-choice answer as its choices, not letter by letter', () => {
      const text = renderElement(
        { type: 'Control', scope: '#/properties/contactMethods' },
        { contactMethods: ['Email', 'Phone'] },
        { type: 'object', properties: { contactMethods: { type: 'array', items: { type: 'string' } } } },
      );

      expect(text).toContain('Contact methods : Email, Phone');
      expect(text).not.toMatch(/\b0 : E\b/);
    });

    it('counts the files in a multi-file field', () => {
      const text = renderElement(
        { type: 'Control', scope: '#/properties/supportingDocuments' },
        {
          supportingDocuments: [
            'urn:ads:platform:file-service:v1:/files/a',
            'urn:ads:platform:file-service:v1:/files/b',
          ],
        },
        { type: 'object', properties: { supportingDocuments: { type: 'array', items: { type: 'string' } } } },
      );

      expect(text).toContain('Supporting documents : 2 files uploaded');
    });

    it('shows a multiple-choice answer inside a repeating section as its choices', () => {
      const text = renderElement(
        {
          type: 'ListWithDetail',
          scope: '#/properties/dependents',
          options: {
            detail: { type: 'VerticalLayout', elements: [{ type: 'Control', scope: '#/properties/languages' }] },
          },
        },
        { dependents: [{ languages: ['English', 'Cree'] }] },
        {
          type: 'object',
          properties: {
            dependents: {
              type: 'array',
              items: { type: 'object', properties: { languages: { type: 'array', items: { type: 'string' } } } },
            },
          },
        },
      );

      expect(text).toContain('Dependents');
      expect(text).toContain('Languages : English, Cree');
    });

    it('shows each item of a repeating section laid out with elements', () => {
      const text = renderElement(
        {
          type: 'ListWithDetail',
          scope: '#/properties/pets',
          elements: [{ type: 'Control', scope: '#/properties/name' }],
        },
        { pets: [{ name: 'Rex' }, { name: 'Tom' }] },
      );

      expect(text).toContain('Name : Rex');
      expect(text).toContain('Name : Tom');
    });

    it('still shows each item of a list of objects with its fields', () => {
      const text = renderElement(
        { type: 'Control', scope: '#/properties/employmentHistory' },
        { employmentHistory: [{ employer: 'Alberta' }] },
        {
          type: 'object',
          properties: {
            employmentHistory: {
              type: 'array',
              items: { type: 'object', properties: { employer: { type: 'string' } } },
            },
          },
        },
      );

      expect(text).toContain('Employer : Alberta');
    });

    it('shows the fields of an object value under its title', () => {
      const text = renderElement(
        { type: 'Control', scope: '#/properties/address' },
        { address: { city: 'Edmonton' } },
        { type: 'object', properties: { address: { type: 'object', properties: { city: { type: 'string' } } } } },
      );

      expect(text).toContain('Address');
      expect(text).toContain('City : Edmonton');
    });

    it('shows a group with its label and its controls, marking required fields', () => {
      const text = renderElement(
        {
          type: 'Group',
          label: 'Applicant',
          elements: [
            { type: 'Control', scope: '#/properties/firstName' },
            { type: 'Control', scope: '#/properties/subdivisionCode', label: 'subdivisionCode' },
          ],
        },
        { firstName: 'Ada', subdivisionCode: 'AB' },
        { type: 'object', properties: { firstName: { type: 'string' } }, required: ['firstName'] },
      );

      expect(text).toContain('Applicant');
      expect(text).toContain('First name * : Ada');
      expect(text).toContain('Province : Alberta');
    });

    it('uses a control label when it has one', () => {
      expect(
        renderElement({ type: 'Control', scope: '#/properties/amount', label: 'Monthly amount' }, { amount: 5 }),
      ).toContain('Monthly amount : 5');
    });

    it('shows a single uploaded file and a missing answer', () => {
      const text = renderElement(
        {
          type: 'VerticalLayout',
          elements: [
            { type: 'Control', scope: '#/properties/proof' },
            { type: 'Control', scope: '#/properties/notes' },
          ],
        },
        { proof: 'urn:ads:platform:file-service:v1:/files/a' },
      );

      expect(text).toContain('Proof : 1 file uploaded');
      expect(text).toContain('Notes : (none given)');
    });
  });

  describe('helpers', () => {
    it('formats dates and leaves other values as they are', () => {
      expect(
        textOf(
          renderTemplate(
            '{{formatDate data.date format="yyyy-MM-dd"}}|{{formatDate data.text format="yyyy"}}|{{formatDate data.number}}',
            {
              date: new Date('2026-11-19T18:00:00Z'),
              text: '2026-11-19T18:00:00Z',
              number: 5,
            },
          ),
        ),
      ).toBe('2026-11-19|2026|5');
    });

    it('says whether a value exists', () => {
      expect(
        textOf(
          renderTemplate(
            '{{#each data.values}}{{#if (valueExists this)}}yes{{else}}no{{/if}} {{/each}}{{#if (valueExists data.missing)}}yes{{else}}no{{/if}}',
            { values: ['text', '  ', [], ['a'], 5] },
          ),
        ),
      ).toBe('yes no no yes yes no');
    });

    it('builds a download link for a File Service file and nothing for other values', async () => {
      await flushPromises();
      const text = textOf(
        renderTemplate('{{fileId data.urn}}|{{fileId data.id}}|{{fileId data.otherUrn}}|{{fileId data.invalid}}', {
          urn: 'urn:ads:platform:file-service:v1:/files/abc',
          id: '0f4e2c1a-8b9d-4e5f-a6b7-c8d9e0f1a2b3',
          otherUrn: 'urn:ads:platform:other-service:v1:/x',
          invalid: 'not-a-file',
        }),
      );

      expect(text).toBe(
        'https://file.example/file/v1/files/abc/download?unsafe=true&embed=true|' +
          'https://file.example/file/v1/files/0f4e2c1a-8b9d-4e5f-a6b7-c8d9e0f1a2b3/download?unsafe=true&embed=true||',
      );
    });

    it('answers the element checks used by form templates', () => {
      const text = textOf(
        renderTemplate(
          '{{#if (eq 1 1)}}eq {{/if}}{{#if (isControl data.control)}}control {{/if}}' +
            '{{#if (isDataSchema data.schema)}}schema {{/if}}{{#if (hasTypeControlOrList data.list)}}list {{/if}}' +
            '{{scopeName data.control.scope}}',
          {
            control: { type: 'Control', scope: '#/properties/firstName' },
            schema: {},
            list: { type: 'ListWithDetail' },
          },
        ),
      );

      expect(text).toBe('eq control schema list FirstName');
    });

    it('steps into the data at an element scope', () => {
      expect(
        textOf(
          renderTemplate('{{#grabDataArray data.content data.element}}{{city}}{{/grabDataArray}}', {
            content: { address: { city: 'Edmonton' } },
            element: { scope: '#/properties/address' },
          }),
        ),
      ).toBe('Edmonton');
    });
  });

  it('finds required fields in nested objects and list items', () => {
    expect(
      getAllRequiredFields({
        type: 'object',
        required: ['name'],
        properties: {
          name: { type: 'string' },
          address: { type: 'object', required: ['city'], properties: { city: { type: 'string' } } },
          pets: { type: 'array', items: { type: 'object', required: ['petName'], properties: {} } },
        },
      }),
    ).toEqual(['name', 'city', 'petName']);
  });
});
