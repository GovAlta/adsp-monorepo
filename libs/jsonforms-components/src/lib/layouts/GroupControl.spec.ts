import '@testing-library/jest-dom';
import { GoAGroupControlComponent } from './GroupControl';
import { ControlElement, Layout, LayoutProps } from '@jsonforms/core';
import { render } from '@testing-library/react';

describe('Input Group Control tests', () => {
  const groupUiSchema: Layout = {
    type: 'Group',
    elements: [
      {
        type: 'Control',
        options: {
          componentProps: {},
        },
      },
    ],
  };

  const staticProps: LayoutProps = {
    uischema: groupUiSchema,
    schema: {},
    enabled: true,
    label: 'Group Name',
    config: {},
    path: '',
    data: '',
    visible: true,
    direction: 'row',
  };

  describe('can create control for GoAGroupControlComponent', () => {
    it('can create control', () => {
      const props = { ...staticProps };
      const component = render(GoAGroupControlComponent(props));
      expect(component).toBeDefined();
    });
  });
});
