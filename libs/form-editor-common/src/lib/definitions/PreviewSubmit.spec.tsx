import { fireEvent, render } from '@testing-library/react';
import { JsonSchema, UISchemaElement } from '@jsonforms/core';
import { PreviewSubmit, isPreviewDataValid, isSinglePageForm } from './PreviewSubmit';

jest.mock(
  '@lib/validation/checkInput',
  () => {
    const Ajv = require('ajv');
    return { ajv: new Ajv({ allErrors: true, strict: false }) };
  },
  { virtual: true }
);

const mockGetEmptyRequiredStringErrors = jest.fn((data: Record<string, unknown>) =>
  data?.name === '' ? [{ instancePath: '/name' }] : []
);
jest.mock(
  '@abgov/jsonforms-components',
  () => ({
    getEmptyRequiredStringErrors: (data: Record<string, unknown>) => mockGetEmptyRequiredStringErrors(data),
  }),
  { virtual: true }
);

const schema: JsonSchema = {
  type: 'object',
  properties: { name: { type: 'string' } },
  required: ['name'],
};
const singlePage = { type: 'VerticalLayout', elements: [] } as UISchemaElement;
const stepper = { type: 'Categorization', elements: [] } as UISchemaElement;

const byTestId = (container: HTMLElement, testId: string) => container.querySelector(`[testid="${testId}"]`) as Element;

describe('PreviewSubmit', () => {
  it('detects single page forms', () => {
    expect(isSinglePageForm(singlePage)).toBe(true);
    expect(isSinglePageForm(stepper)).toBe(false);
    expect(isSinglePageForm(undefined)).toBe(false);
  });

  it('validates data against the schema', () => {
    expect(isPreviewDataValid(schema, { name: 'a' })).toBe(true);
    expect(isPreviewDataValid(schema, {})).toBe(false);
    expect(isPreviewDataValid(schema, undefined)).toBe(false);
    expect(isPreviewDataValid({ type: 'bogus' } as unknown as JsonSchema, {})).toBe(false);
  });

  it("uses the stepper's empty required string rule", () => {
    expect(isPreviewDataValid(schema, { name: '' })).toBe(false);
    expect(mockGetEmptyRequiredStringErrors).toHaveBeenCalledWith({ name: '' });
  });

  it('renders nothing for stepper forms', () => {
    const { container } = render(<PreviewSubmit data={{}} schema={schema} uiSchema={stepper} />);
    expect(byTestId(container, 'preview-submit-btn')).toBeNull();
  });

  it('disables submit until required fields are filled', () => {
    const { container } = render(<PreviewSubmit data={{}} schema={schema} uiSchema={singlePage} />);
    expect(byTestId(container, 'preview-submit-btn').getAttribute('disabled')).toBe('true');
  });

  it('opens and closes the confirmation modal when valid', () => {
    const { container } = render(<PreviewSubmit data={{ name: 'a' }} schema={schema} uiSchema={singlePage} />);
    const button = byTestId(container, 'preview-submit-btn');
    expect(button.getAttribute('disabled')).not.toBe('true');
    fireEvent(button, new CustomEvent('_click'));
    expect(byTestId(container, 'submit-confirmation').getAttribute('open')).toBe('true');
    fireEvent(byTestId(container, 'close-submit-modal'), new CustomEvent('_click'));
    expect(byTestId(container, 'submit-confirmation').getAttribute('open')).not.toBe('true');
  });
});
