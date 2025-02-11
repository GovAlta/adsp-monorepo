import '@testing-library/jest-dom';
import { withIsStepper } from './GroupControl';
import { GroupLayout, LayoutProps } from '@jsonforms/core';
import { render } from '@testing-library/react';
import { GoAGroupReviewControlComponent } from './GroupReviewControl';

describe('Group Review Control tests', () => {
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

    it('can create GoAGroupReviewControlComponent control', () => {
      const props = { ...staticProps };
      const component = render(GoAGroupReviewControlComponent(props));
      expect(component).toBeDefined();
    });
  });
});
