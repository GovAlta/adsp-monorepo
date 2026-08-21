import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { FormViewer } from './FormViewer';

/**
 * VERY IMPORTANT:  Rendering <JsonForms ... /> does not work unless the following
 * is included.
 */
window.matchMedia = jest.fn().mockImplementation((query) => ({
  matches: true,
  media: query,
  onchange: null,
  addListener: jest.fn(),
  removeListener: jest.fn(),
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
  dispatchEvent: jest.fn(),
}));

const dataSchema = {
  type: 'object',
  properties: {
    firstName: { type: 'string' },
    lastName: { type: 'string' },
  },
};

const uiSchema = {
  type: 'Categorization',
  elements: [
    {
      type: 'Category',
      label: 'Applicant',
      elements: [
        { type: 'Control', scope: '#/properties/firstName', label: 'First name' },
        { type: 'Control', scope: '#/properties/lastName', label: 'Last name' },
      ],
    },
  ],
};

const store = configureStore({ reducer: { noop: (state = {}) => state } });

const renderViewer = () =>
  render(
    <Provider store={store}>
      <FormViewer
        dataSchema={dataSchema}
        uiSchema={uiSchema}
        data={{ firstName: 'Bob', lastName: 'Smith' }}
        files={{}}
      />
    </Provider>,
  );

describe('FormViewer', () => {
  it('renders the submitted answers', () => {
    renderViewer();

    expect(screen.getByText('Applicant')).toBeInTheDocument();
    expect(screen.getByText('Bob')).toBeInTheDocument();
    expect(screen.getByText('Smith')).toBeInTheDocument();
  });

  it('does not offer Change buttons, since reviewers cannot edit a submission', () => {
    renderViewer();

    expect(screen.queryByText('Change')).not.toBeInTheDocument();
  });
});
