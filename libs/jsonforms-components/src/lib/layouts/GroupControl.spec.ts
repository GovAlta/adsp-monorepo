import '@testing-library/jest-dom';
import { GoAGroupControlComponent, withIsStepper } from './GroupControl';
import { GroupLayout, LayoutProps } from '@jsonforms/core';
import { render, screen } from '@testing-library/react';

describe('Group Layout tests', () => {
  const groupUiSchema: GroupLayout = {
    type: 'Group',
    label: 'Test label',
    elements: [
      {
        type: 'Control',
      },
    ],
    options: {
      componentProps: {
        type: 'success',
        accent: 'thick',
        padding: 'relaxed',
      },
    },
  };
  const groupUiSchemaThinAccent: GroupLayout = {
    type: 'Group',
    label: 'Test label',
    elements: [
      {
        type: 'Control',
      },
    ],
    options: {
      componentProps: {
        type: 'success',
        accent: 'thin',
        padding: 'relaxed',
      },
    },
  };

  const groupUiSchemaUndefined: GroupLayout = {
    type: 'Group',
    elements: [
      {
        type: 'Control',
      },
    ],
    options: {
      componentProps: {
        type: undefined,
        accent: undefined,
        padding: undefined,
      },
    },
  };

  const groupUiSchemaInvalidComponentProps: GroupLayout = {
    type: 'Group',
    elements: [
      {
        type: 'Control',
      },
    ],
    options: {
      componentProps: {
        invalidType: 'invalidType-success',
        invalidAccent: 'invalidAccent',
        invalidPadding: 'invalidPadding',
      },
    },
  };

  const staticProps: LayoutProps & withIsStepper = {
    uischema: groupUiSchema,
    schema: {},
    enabled: true,
    label: 'Group Name',
    config: {},
    path: '',
    data: '',
    visible: true,
    direction: 'row',
    isStepperReview: false,
  };

  const staticPropsThickAccent: LayoutProps & withIsStepper = {
    uischema: groupUiSchema,
    schema: {},
    enabled: true,
    label: 'Group Name',
    config: {},
    path: '',
    data: '',
    visible: true,
    direction: 'row',
    isStepperReview: false,
  };

  const staticPropsThinAccent: LayoutProps & withIsStepper = {
    uischema: groupUiSchemaThinAccent,
    schema: {},
    enabled: true,
    label: 'Group Name',
    config: {},
    path: '',
    data: '',
    visible: true,
    direction: 'row',
    isStepperReview: false,
  };

  const staticPropsUndefined: LayoutProps & withIsStepper = {
    uischema: groupUiSchemaUndefined,
    schema: {},
    enabled: true,
    label: 'Group Name',
    config: {},
    path: '',
    data: '',
    visible: true,
    direction: 'row',
    isStepperReview: false,
  };

  const staticPropsInvalidComponentProps: LayoutProps & withIsStepper = {
    uischema: groupUiSchemaInvalidComponentProps,
    schema: {},
    enabled: true,
    label: 'Group Name',
    config: {},
    path: '',
    data: '',
    visible: true,
    direction: 'row',
    isStepperReview: false,
  };

  describe('can create control for GoAGroupControlComponent', () => {
    beforeEach(() => {
      window.matchMedia = jest.fn().mockImplementation((query) => {
        return {
          matches: true,
          media: query,
          onchange: null,
          addListener: jest.fn(),
          removeListener: jest.fn(),
          addEventListener: jest.fn(),
          removeEventListener: jest.fn(),
          dispatchEvent: jest.fn(),
        };
      });
    });

    it('can create control', () => {
      const props = { ...staticProps };
      const component = render(GoAGroupControlComponent(props));
      expect(component).toBeDefined();
    });
    it('should render with thick accent and heading', () => {
      const props = { ...staticPropsThickAccent };
      const { container } = render(GoAGroupControlComponent(props));
      expect(container).toBeDefined();
      const goaContainerEl = container.querySelector('goa-container');
      expect(goaContainerEl).toHaveAttribute('accent', 'thick');
      expect(goaContainerEl).toHaveAttribute('type', 'success');
      expect(goaContainerEl).toHaveAttribute('padding', 'relaxed');
      expect(screen.getByText('Test label')).toBeInTheDocument();
    });
    it('should render with thin accent ', () => {
      const props = { ...staticPropsThinAccent };
      const { container } = render(GoAGroupControlComponent(props));
      expect(container).toBeDefined();
      const goaContainerEl = container.querySelector('goa-container');
      expect(goaContainerEl).toHaveAttribute('accent', 'thin');
      expect(goaContainerEl).toHaveAttribute('type', 'success');
      expect(goaContainerEl).toHaveAttribute('padding', 'relaxed');
      const headingElement = container.querySelector('h3');

      expect(headingElement).toBeInTheDocument();
      expect(headingElement).toHaveTextContent('Test label');
    });

    it('can check container attributes is valid', async () => {
      const props = { ...staticProps };
      const { container } = render(GoAGroupControlComponent(props));

      const el = await container.querySelector('goa-container');
      const typeAttribute = el?.getAttribute('type');
      const accentAttribute = el?.getAttribute('accent');
      const relaxedAttribute = el?.getAttribute('padding');

      expect(typeAttribute).toBe('success');
      expect(accentAttribute).toBe('thick');
      expect(relaxedAttribute).toBe('relaxed');
    });

    it('can check container attributes is undefined', () => {
      const props = {
        ...staticPropsUndefined,
      };
      const { container } = render(GoAGroupControlComponent(props));

      const el = container.querySelector('goa-container');
      const typeAttribute = el?.getAttribute('type');
      const accentAttribute = el?.getAttribute('accent');
      const relaxedAttribute = el?.getAttribute('padding');

      //The expect is set to check a null value because when the componentProps is set to undefined, and the .getAttribute gets
      //invoked it will converted it to either or a string or null. So if it is undefined it changes it to a null value.
      expect(typeAttribute).toBeNull();
      expect(accentAttribute).toBeNull();
      expect(relaxedAttribute).toBeNull();
    });

    it('can check attributes is not a proper attribute name', () => {
      const props = {
        ...staticPropsInvalidComponentProps,
      };

      const { container } = render(GoAGroupControlComponent(props));
      const el = container.querySelector('goa-container');

      expect(!el?.getAttributeNames().includes('invalidType')).toBe(true);
      expect(!el?.getAttributeNames().includes('invalidAccent')).toBe(true);
      expect(!el?.getAttributeNames().includes('invalidPadding')).toBe(true);
    });

    it('can check attribute value are invalid for attribute name', () => {
      const props = {
        ...staticPropsInvalidComponentProps,
      };

      const validTypeNames = ['success', 'info', 'non-interactive', 'error', 'interactive'];
      const validAccentNames = ['filled', 'thick', 'thin'];
      const validPaddingNames = ['relaxed', 'compact'];

      const { container } = render(GoAGroupControlComponent(props));
      const el = container.querySelector('goa-container');

      const typeAttribute = el?.getAttribute('type') as string;
      const accentAttribute = el?.getAttribute('accent') as string;
      const relaxedAttribute = el?.getAttribute('padding') as string;

      expect(!validTypeNames.includes(typeAttribute)).toBe(true);
      expect(!validAccentNames.includes(accentAttribute)).toBe(true);
      expect(!validPaddingNames.includes(relaxedAttribute)).toBe(true);
    });
    it('should render without label when componentProps present and no accent', () => {
      const uischema = {
        type: 'Group',
        label: undefined, // Explicitly undefined
        elements: [],
        options: {
          componentProps: {
            padding: 'relaxed',
          },
        },
      };
      const props = { ...staticProps, uischema };
      const { container } = render(GoAGroupControlComponent(props));
      expect(container.querySelector('h3')).toBeNull();
    });

    it('should render without label when no componentProps', () => {
      const uischema = {
        type: 'Group',
        label: undefined,
        elements: [],
      };
      const props = { ...staticProps, uischema };
      const { container } = render(GoAGroupControlComponent(props));
      expect(container.querySelector('h3')).toBeNull();
    });

    it('should render in stepper review mode', () => {
      const uischema = {
        type: 'Group',
        label: 'Test Group',
        elements: [],
      };
      const props = { ...staticProps, uischema, isStepperReview: true };
      const { container } = render(GoAGroupControlComponent(props));
      // Should not contain GoabContainer if isStepperReview is true
      expect(container.querySelector('goa-container')).toBeNull();
    });
  });
});
