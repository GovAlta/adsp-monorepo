import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ObjectArrayControl, NonEmptyCellComponent } from './ObjectListControl';
import { ControlElement, ArrayTranslations } from '@jsonforms/core';
import { JsonFormContext } from '../../Context';
import { JsonFormsDispatch, useJsonForms } from '@jsonforms/react';
import { ReviewRenderProvider } from '../../Context/ReviewRenderContext';
jest.mock('@jsonforms/react');

const mockUISchema: ControlElement = {
  type: 'Control',
  scope: '#/properties/comments',
};

const sharedProps = {
  enabled: true,
  errors: '',
  cells: [],
  renders: [],
  schema: {
    type: 'object',
    properties: {
      date: {
        type: 'string',
        format: 'date',
      },
      message: {
        type: 'string',
        maxLength: 5,
      },
      enum: {
        type: 'string',
        enum: ['foo', 'bar'],
      },
    },
  },
};

const rootSchema = {
  type: 'object',
  properties: {
    comments: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          date: {
            type: 'string',
            format: 'date',
          },
          message: {
            type: 'string',
            maxLength: 5,
          },
          enum: {
            type: 'string',
            enum: ['foo', 'bar'],
          },
        },
      },
    },
  },
};

const mockTranslations: ArrayTranslations = {
  addTooltip: 'Add to Comments',
  addAriaLabel: 'Add to Comments button',
  removeTooltip: 'Delete',
  removeAriaLabel: 'Delete button',
  upAriaLabel: 'Move item up',
  up: 'Up',
  down: 'Down',
  downAriaLabel: 'Move item down',
  noDataMessage: 'No data',
  noSelection: 'No selection',
  deleteDialogTitle: 'Confirm Deletion',
  deleteDialogMessage: 'Are you sure you want to delete the selected entry?',
  deleteDialogAccept: 'Yes',
  deleteDialogDecline: 'No',
};

const baseMockProps = {
  ...sharedProps,
  addItems: jest.fn(),
  config: {},
  data: 0,
  description: 'mock object array list',
  handleChange: jest.fn(),
  id: '#/properties/comments',
  label: 'Comments',
  minItems: undefined,
  moveDown: jest.fn(),
  moveUp: jest.fn(),
  openDeleteDialog: jest.fn(),
  path: 'dependant',
  removeItems: jest.fn(),
  rootSchema: rootSchema,
  uischema: mockUISchema,
  visible: true,
  translations: mockTranslations,
  addItem: jest.fn(),
};
describe('Object List component', () => {
  const reviewProps = {
    ...baseMockProps,
    data: [{ date: '2026-01-01', message: 'Hi' }],
    isStepperReview: true,
    uischema: { ...mockUISchema, options: { stepId: 0 } },
  };

  it('renders a Change button in review by default', async () => {
    (useJsonForms as jest.Mock).mockReturnValue({
      core: { schema: rootSchema, errors: [] },
      cells: [],
      renderers: [],
    });

    render(
      <table>
        <tbody>
          <ObjectArrayControl {...reviewProps} />
        </tbody>
      </table>,
    );

    expect(screen.getByText('Change')).toBeInTheDocument();
  });

  it('does not render a Change button in review when the host turns change buttons off', async () => {
    (useJsonForms as jest.Mock).mockReturnValue({
      core: { schema: rootSchema, errors: [] },
      cells: [],
      renderers: [],
    });

    render(
      <JsonFormContext.Provider value={{ showChangeButtons: false }}>
        <table>
          <tbody>
            <ObjectArrayControl {...reviewProps} />
          </tbody>
        </table>
      </JsonFormContext.Provider>,
    );

    expect(screen.queryByText('Change')).not.toBeInTheDocument();
    expect(screen.getByText('Comments')).toBeInTheDocument();
  });

  it('Can render the object array component', async () => {
    render(<ObjectArrayControl {...baseMockProps} />);
    const ObjectListWrapper = screen.getByTestId('jsonforms-object-list-wrapper');
    expect(ObjectListWrapper).toBeTruthy();
  });

  it('shows the object array list when the toolbar add button is clicked from an empty array', async () => {
    (useJsonForms as jest.Mock).mockReturnValue({
      core: { schema: rootSchema, errors: [] },
      cells: [],
      renderers: [],
    });
    const handleChange = jest.fn();
    const props = {
      ...baseMockProps,
      data: [],
      handleChange,
    };

    const { baseElement } = render(<ObjectArrayControl {...props} />);
    const addButton = baseElement.querySelector('goa-button');

    fireEvent(
      addButton!,
      new CustomEvent('_click', {
        bubbles: true,
      }),
    );

    expect(handleChange).toHaveBeenCalledWith('dependant', [{}]);
    await waitFor(() => expect(baseElement.querySelector('goa-input')).toBeInTheDocument());
  });

  it('Can render components with defined layout in the not empty cell', async () => {
    const props = {
      ...sharedProps,
      isValid: true,
      errors: {},
      rowPath: 'comments.0',
      data: undefined,
      uischema: {
        type: 'VerticalLayout',
        elements: [
          {
            type: 'Control',
            scope: '#/properties/comments',
            elements: [
              {
                type: 'VerticalLayout',
                elements: [
                  {
                    type: 'Control',
                    scope: '#/properties/mock-one',
                  },
                ],
              },
            ],
          },
        ],
      },
    };

    render(<NonEmptyCellComponent openDeleteDialog={() => {}} handleChange={() => {}} {...props} />);

    expect(JsonFormsDispatch).toHaveBeenCalledTimes(1);
  });

  it('Can render components without layout in the not empty cell', async () => {
    const props = {
      ...sharedProps,
      isValid: true,
      errors: {},
      rowPath: 'comments.0',
      data: undefined,
      uischema: {
        type: 'VerticalLayout',
        elements: [
          {
            type: 'Control',
            scope: '#/properties/comments',
            elements: [
              {
                type: 'Control',
                scope: '#/properties/mock-one',
              },
            ],
          },
        ],
      },
    };

    render(<NonEmptyCellComponent openDeleteDialog={() => {}} handleChange={() => {}} {...props} />);

    expect(JsonFormsDispatch).toHaveBeenCalledTimes(2);
  });
});

describe('Object List change reporting', () => {
  it('reports the step and scope to a host with no stepper in the tree', () => {
    (useJsonForms as jest.Mock).mockReturnValue({
      core: { schema: rootSchema, errors: [] },
      cells: [],
      renderers: [],
    });

    const onReviewChange = jest.fn();
    const { baseElement } = render(
      <ReviewRenderProvider onReviewChange={onReviewChange}>
        <table>
          <tbody>
            <ObjectArrayControl
              {...baseMockProps}
              data={[{ date: '2026-01-01', message: 'Hi' }]}
              isStepperReview={true}
              uischema={{ ...mockUISchema, options: { stepId: 5 } }}
            />
          </tbody>
        </table>
      </ReviewRenderProvider>,
    );

    fireEvent(baseElement.querySelector('goa-button')!, new CustomEvent('_click'));

    expect(onReviewChange).toHaveBeenCalledWith(5, '#/properties/comments');
  });
});
