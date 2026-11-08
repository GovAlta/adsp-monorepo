import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { JsonformsReviewResponsive, SAMPLE_DATA } from './JsonformsReviewResponsive';

const rendered: { data?: unknown; readonly?: boolean; uischema?: { type: string } } = {};

jest.mock('@abgov/jsonforms-components', () => ({
  ContextProviderFactory:
    () =>
    ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  createDefaultAjv: () => ({}),
  tryResolveRefs: (schema: unknown) => Promise.resolve([schema]),
  GoACells: [],
  GoAReviewRenderers: [],
}));

jest.mock('@abgov/data-exchange-standard', () => ({
  standardV1JsonSchema: {},
  commonV1JsonSchema: {},
}));

jest.mock('@jsonforms/react', () => ({
  JsonForms: (props: { data: unknown; readonly: boolean; uischema: { type: string } }) => {
    rendered.data = props.data;
    rendered.readonly = props.readonly;
    rendered.uischema = props.uischema;
    return <div data-testid="json-forms" />;
  },
}));

describe('JsonformsReviewResponsive', () => {
  it('renders the review read-only with the long-value sample data', async () => {
    render(<JsonformsReviewResponsive />);

    expect(await screen.findByTestId('json-forms')).toBeInTheDocument();
    expect(rendered.readonly).toBe(true);
    expect(rendered.data).toBe(SAMPLE_DATA);
    expect(rendered.uischema?.type).toBe('Categorization');
  });
});
