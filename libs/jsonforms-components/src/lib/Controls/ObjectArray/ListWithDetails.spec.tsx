import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ListWithDetailControl, NonEmptyCellComponent } from './ListWithDetailControl';
import { ControlElement, ArrayTranslations } from '@jsonforms/core';
import { JsonFormsDispatch } from '@jsonforms/react';
import { extractScopesFromUISchema } from './ListWithDetailControl';
jest.mock('@jsonforms/react');

class MockResizeObserver {
  observe() {}
  disconnect() {}
}

global.ResizeObserver = MockResizeObserver as never;

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
  description: 'mock list with detail list',
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
  it('Can render the list with detail component', async () => {
    render(<ListWithDetailControl {...baseMockProps} />);
    const ObjectListWrapper = screen.getByTestId('jsonforms-object-list-wrapper');
    expect(ObjectListWrapper).toBeTruthy();
  });
  it('Can render the list with detail component and no label', async () => {
    const newMockProps = { ...baseMockProps };
    // @ts-expect-error not explicity defined
    delete newMockProps?.label;
    render(<ListWithDetailControl {...newMockProps} />);
    const ObjectListWrapper = screen.getByTestId('jsonforms-object-list-wrapper');
    expect(ObjectListWrapper).toBeTruthy();
  });

  it('Can render components with defined layout in the not empty cell', async () => {
    const props = {
      ...sharedProps,
      isValid: true,
      enabled: false,
      rowPath: 'comments.0',
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
        options: {
          itemLabel: 'test label',
        },
      },
    };

    render(<NonEmptyCellComponent {...props} />);

    expect(JsonFormsDispatch).toHaveBeenCalledTimes(1);
  });

  it('Can render components without layout in the not empty cell', async () => {
    const props = {
      ...sharedProps,
      isValid: true,
      rowPath: 'comments.0',
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

    render(<NonEmptyCellComponent {...props} />);

    expect(JsonFormsDispatch).toHaveBeenCalledTimes(2);
  });

  it('Can extract scope in the elements', () => {
    const uiSchema = {
      elements: [
        {
          type: 'VerticalLayout',
          elements: [
            {
              type: 'Control',
              scope: '#properties/mock-one',
            },
          ],
        },
      ],
    };

    const scopes = extractScopesFromUISchema(uiSchema);
    expect(scopes.length).toBe(1);
  });

  it('Can extract scope in the options elements', () => {
    const uiSchema = {
      options: {
        detail: {
          elements: [
            {
              type: 'Control',
              scope: '#properties/mock-one',
            },
          ],
        },
      },
    };

    const scopes = extractScopesFromUISchema(uiSchema);
    expect(scopes.length).toBe(1);
  });

  it('Can extract scope in the options elements in depth', () => {
    const uiSchema = {
      options: {
        detail: {
          elements: [
            {
              type: 'VerticalLayout',
              elements: [
                {
                  type: 'Control',
                  scope: '#properties/mock-one',
                },
              ],
            },
          ],
        },
      },
    };

    const scopes = extractScopesFromUISchema(uiSchema);
    expect(scopes.length).toBe(1);
  });
});
