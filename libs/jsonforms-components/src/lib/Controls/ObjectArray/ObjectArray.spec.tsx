import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ObjectArrayControl, NonEmptyCellComponent } from './ObjectListControl';
import { ControlElement, ArrayTranslations } from '@jsonforms/core';
import { JsonFormsDispatch } from '@jsonforms/react';
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
  it('Can render the object array component', async () => {
    render(<ObjectArrayControl {...baseMockProps} />);
    const ObjectListWrapper = screen.getByTestId('jsonforms-object-list-wrapper');
    expect(ObjectListWrapper).toBeTruthy();
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
