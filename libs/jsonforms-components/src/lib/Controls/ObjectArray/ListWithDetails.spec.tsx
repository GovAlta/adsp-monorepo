import { act, fireEvent, render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ListWithDetailControl, NonEmptyCellComponent } from './ListWithDetailControl';
import { ControlElement, ArrayTranslations } from '@jsonforms/core';
import { JsonFormsDispatch, useJsonForms } from '@jsonforms/react';
import { extractScopesFromUISchema } from './ListWithDetailControl';
import ObjectArrayToolBar from './ObjectArrayToolBar';
jest.mock('./ObjectArrayToolBar', () => ({
  __esModule: true,
  default: jest.fn((props) => (
    <div>
      <button data-testid="mock-toolbar-add" disabled={!props.enabled} onClick={() => props.addItem(props.path, {})()}>
        add
      </button>
      <button data-testid="mock-toolbar-page" onClick={() => props.setCurrentListPage(1)}>
        page
      </button>
    </div>
  )),
}));

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
  setCurrentTab: jest.fn(),
  currentTab: 0,
};
describe('Object List component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (JsonFormsDispatch as jest.Mock).mockImplementation(() => null);
    (useJsonForms as jest.Mock).mockReturnValue({
      core: {
        data: {},
        errors: [],
        schema: rootSchema,
        uischema: mockUISchema,
      },
      cells: [],
      renderers: [],
    });
  });

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

    expect(JsonFormsDispatch).toHaveBeenCalledTimes(1);
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

  describe('extractScopesFromUISchema', () => {
    it('extracts scopes from a simple Control', () => {
      const uischema = {
        type: 'Control',
        scope: '#/properties/comments',
      };
      expect(extractScopesFromUISchema(uischema)).toEqual([]);
    });

    it('extracts scopes from a Layout with nested Controls', () => {
      const uischema = {
        type: 'VerticalLayout',
        elements: [
          { type: 'Control', scope: '#/properties/first' },
          { type: 'Control', scope: '#/properties/second' },
        ],
      };
      expect(extractScopesFromUISchema(uischema)).toEqual(['#/properties/first', '#/properties/second']);
    });
  });

  it('calls addItem callback and selects the new tab when under max items', () => {
    const addItemRunner = jest.fn();
    const addItem = jest.fn(() => addItemRunner);
    const setCurrentTab = jest.fn();

    render(
      <ListWithDetailControl
        {...baseMockProps}
        data={0}
        addItem={addItem}
        setCurrentTab={setCurrentTab}
        uischema={{
          type: 'ListWithDetail',
          scope: '#/properties/comments',
          label: 'Comments',
          options: {
            detail: {
              type: 'VerticalLayout',
              maxItems: 2,
              elements: [],
            },
          },
        }}
      />,
    );

    fireEvent.click(screen.getByTestId('mock-toolbar-add'));

    expect(addItem).toHaveBeenCalledWith('dependant', {});
    expect(addItemRunner).toHaveBeenCalled();
    expect(setCurrentTab).toHaveBeenCalledWith(0);
  });

  it('shows and clears a max items error when addItem is blocked', () => {
    jest.useFakeTimers();
    const addItemRunner = jest.fn();
    const addItem = jest.fn(() => addItemRunner);

    render(
      <ListWithDetailControl
        {...baseMockProps}
        data={1}
        addItem={addItem}
        uischema={{
          type: 'ListWithDetail',
          scope: '#/properties/comments',
          label: 'Comments',
          options: {
            detail: {
              type: 'VerticalLayout',
              maxItems: 1,
              elements: [],
            },
          },
        }}
      />,
    );

    fireEvent.click(screen.getByTestId('mock-toolbar-add'));

    expect(screen.getByText('Maximum 1 items allowed.')).toBeInTheDocument();
    expect(addItem).not.toHaveBeenCalled();

    act(() => {
      jest.advanceTimersByTime(3000);
    });
    expect(screen.queryByText('Maximum 1 items allowed.')).not.toBeInTheDocument();
    jest.useRealTimers();
  });

  it('disables the toolbar while editing without left tabs', () => {
    render(
      <ListWithDetailControl
        {...baseMockProps}
        data={0}
        uischema={{
          type: 'ListWithDetail',
          scope: '#/properties/comments',
          label: 'Comments',
          options: {
            detail: {
              type: 'VerticalLayout',
              elements: [],
            },
          },
        }}
      />,
    );

    const toolbarMock = ObjectArrayToolBar as jest.Mock;
    expect(toolbarMock.mock.calls.at(-1)?.[0]?.enabled).toBe(true);

    fireEvent.click(screen.getByTestId('mock-toolbar-page'));

    expect(toolbarMock.mock.calls.at(-1)?.[0]?.enabled).toBe(false);
  });

  it('renders fallback controls for properties not defined in the ui schema', () => {
    render(
      <NonEmptyCellComponent
        {...sharedProps}
        isValid={true}
        rowPath="comments.0"
        uischema={
          {
            type: 'VerticalLayout',
            scope: '#/properties/comments',
            elements: [],
            options: {
              detail: {
                elements: [],
              },
            },
          } as never
        }
      />,
    );

    expect(JsonFormsDispatch).toHaveBeenCalledTimes(1);
    expect((JsonFormsDispatch as jest.Mock).mock.calls[0][0].uischema).toEqual({
      type: 'VerticalLayout',
      elements: [
        { type: 'Control', scope: '#/properties/date' },
        { type: 'Control', scope: '#/properties/message' },
        { type: 'Control', scope: '#/properties/enum' },
      ],
    });
  });
});
