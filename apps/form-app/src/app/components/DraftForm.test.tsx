import React, { useContext } from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { JsonFormContext } from '@abgov/jsonforms-components';

// The component reads the store through plain selectors, so feeding them a state object is enough
// and avoids standing up the real store.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let mockState: any;

jest.mock('react-redux', () => ({
  ...jest.requireActual('react-redux'),
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  useSelector: (selector: (state: any) => unknown) => selector(mockState),
  useDispatch: () => jest.fn(),
}));

// Stand in for the rendered form so the assertion is about what reaches the form context, not about
// JsonForms itself.
const AutoPopulatedProbe = (): JSX.Element => {
  const ctx = useContext(JsonFormContext);
  return <div data-testid="auto-populated">{JSON.stringify(ctx?.autoPopulatedData)}</div>;
};

jest.mock('@jsonforms/react', () => ({
  ...jest.requireActual('@jsonforms/react'),
  JsonForms: () => <AutoPopulatedProbe />,
}));

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { DraftForm } = require('./DraftForm');

describe('DraftForm', () => {
  const definition = {
    id: 'test-form',
    name: 'Test form',
    dataSchema: {
      type: 'object',
      properties: { firstName: { type: 'string' }, notes: { type: 'string' } },
    },
    uiSchema: {
      type: 'Categorization',
      elements: [
        {
          type: 'Category',
          label: 'Your details',
          elements: [{ type: 'Control', scope: '#/properties/firstName', options: { autoPopulate: 'firstName' } }],
        },
      ],
      options: { variant: 'stepper' },
    },
  };

  const renderDraftForm = () =>
    render(
      <DraftForm
        definition={definition}
        form={{ id: 'form-1', urn: 'urn:form-1', status: 'Draft' }}
        data={{}}
        canSubmit={false}
        showSubmit={false}
        saving={false}
        submitting={false}
        onChange={jest.fn()}
        onSubmit={jest.fn()}
        onSave={jest.fn()}
      />,
    );

  beforeEach(() => {
    mockState = {
      user: { user: { name: 'Bob Bobson', email: 'bob@example.com' } },
      form: { files: {} },
      file: { metadata: {} },
    };
  });

  // CS-5233: the form stepper needs the auto-populated values, not just their paths, to tell an
  // untouched pre-filled field from one the user has edited. Without this wiring the task status
  // fix silently does nothing.
  it('publishes the auto-populated values on the form context', () => {
    // Act
    renderDraftForm();

    // Assert
    expect(JSON.parse(screen.getByTestId('auto-populated').textContent as string)).toEqual([
      { path: 'firstName', value: 'Bob' },
    ]);
  });

  it('publishes an empty list when there is no signed in user', () => {
    // Arrange: anonymous applications have no profile to populate from.
    mockState.user = { user: undefined };

    // Act
    renderDraftForm();

    // Assert
    expect(JSON.parse(screen.getByTestId('auto-populated').textContent as string)).toEqual([]);
  });
});
