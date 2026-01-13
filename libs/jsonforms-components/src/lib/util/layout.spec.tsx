import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

// Mock JsonFormsDispatch and useJsonForms
jest.mock('@jsonforms/react', () => ({
  JsonFormsDispatch: (props: any) => <span data-testid="dispatch">{props.uischema?.type || 'dispatch'}</span>,
  useJsonForms: jest.fn(() => ({ core: {} })),
}));

// Mock getAjv from @jsonforms/core
jest.mock('@jsonforms/core', () => ({
  getAjv: jest.fn(() => ({ mockAjv: true })),
}));

import { LayoutRenderer, ReviewLayoutRenderer, withAjvProps } from './layout';

describe('layout utilities', () => {
  it('returns null when elements empty', () => {
    const { container } = render(
      // @ts-ignore
      <LayoutRenderer elements={[]} direction="column" />
    );

    expect(container).toBeEmptyDOMElement();
  });

  it('renders children in row direction', () => {
    const elements = [{ type: 'Control' }];
    const { getByTestId } = render(
      // @ts-ignore
      <LayoutRenderer elements={elements} direction="row" visible={true} width="20ch" />
    );

    expect(getByTestId('dispatch')).toBeTruthy();
  });

  it('renders children in column direction for review renderer', () => {
    const elements = [{ type: 'Control' }];
    const { getByTestId } = render(
      // @ts-ignore
      <ReviewLayoutRenderer elements={elements} direction="column" visible={true} />
    );

    expect(getByTestId('dispatch')).toBeTruthy();
  });

  it('withAjvProps injects ajv prop', () => {
    const Dummy: React.FC<{ ajv: any }> = ({ ajv }) => <div data-testid="ajv">{ajv?.mockAjv ? 'yes' : 'no'}</div>;
    const Wrapped = withAjvProps(Dummy);

    const { getByTestId } = render((<Wrapped />) as any);
    expect(getByTestId('ajv')).toHaveTextContent('yes');
  });

  it('renders children in column direction for layout renderer', () => {
    const elements = [{ type: 'Control' }];
    const { getByTestId } = render(
      // @ts-ignore
      <LayoutRenderer elements={elements} direction="column" visible={true} />
    );

    expect(getByTestId('dispatch')).toBeTruthy();
  });

  it('renders children in row direction for review renderer', () => {
    const elements = [{ type: 'Control' }];
    const { getByTestId } = render(
      // @ts-ignore
      <ReviewLayoutRenderer elements={elements} direction="row" visible={true} width="20ch" />
    );

    expect(getByTestId('dispatch')).toBeTruthy();
  });
});
