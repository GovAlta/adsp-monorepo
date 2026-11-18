import { render } from '@testing-library/react';
import { JSONFormPreviewer } from './JsonFormPreviewer';

const uiSchema = { type: 'VerticalLayout', elements: [] };
const dataSchema = { type: 'object', properties: {} };
const mockState = {
  form: { editor: { resolvedDataSchema: dataSchema, uiSchema } },
  session: { userInfo: undefined },
};

jest.mock('react-redux', () => ({
  useSelector: (selector: (state: unknown) => unknown) => selector(mockState),
}));
jest.mock('@store/index', () => ({}), { virtual: true });
jest.mock('@store/form/selectors', () => ({ schemaErrorSelector: () => null }), { virtual: true });
jest.mock(
  '@store/configuration/selectors',
  () => ({ selectRegisterData: () => [], selectRegisterDataList: () => [], selectNonAnonymousDataList: () => [] }),
  { virtual: true }
);
jest.mock('@lib/validation/checkInput', () => ({ ajv: {} }), { virtual: true });
jest.mock(
  '@abgov/jsonforms-components',
  () => ({
    GoARenderers: [],
    GoAReviewRenderers: [],
    GoACells: [],
    JsonFormRegisterProvider: ({ children }: { children: React.ReactNode }) => children,
    createAutoPopulateMiddleware: () => undefined,
  }),
  { virtual: true }
);
jest.mock('@jsonforms/react', () => ({ JsonForms: () => <div data-testid="json-forms" /> }));
jest.mock('./PreviewSubmit', () => ({
  PreviewSubmit: ({ schema, uiSchema }: { schema: unknown; uiSchema: { type: string } }) => (
    <div data-testid="preview-submit" data-ui-type={uiSchema.type} data-has-schema={String(!!schema)} />
  ),
}));

describe('JSONFormPreviewer', () => {
  it('renders the preview submit button under the form', () => {
    const { getByTestId } = render(<JSONFormPreviewer data={{}} onChange={jest.fn()} />);
    expect(getByTestId('json-forms')).toBeTruthy();
    const submit = getByTestId('preview-submit');
    expect(submit.getAttribute('data-ui-type')).toBe('VerticalLayout');
    expect(submit.getAttribute('data-has-schema')).toBe('true');
  });

  it('does not render the preview submit button with review renderers', () => {
    const { queryByTestId } = render(<JSONFormPreviewer data={{}} onChange={jest.fn()} useReviewRenderers />);
    expect(queryByTestId('preview-submit')).toBeNull();
  });
});
