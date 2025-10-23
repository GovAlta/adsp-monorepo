import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { JsonFormsProps, UISchemaElement } from '@jsonforms/core';
import GoACalloutControl from './GoACalloutControl';
import { GoACalloutSize, GoACalloutType } from '@abgov/react-components';

describe('callout control', () => {
  const uiSchema = (
    message: string,
    type: GoACalloutType = 'important',
    size: GoACalloutSize = 'medium'
  ): UISchemaElement => {
    return {
      type: 'Callout',
      options: {
        componentProps: {
          type: type,
          size: size,
          message: message,
        },
      },
    };
  };

  const staticProps: JsonFormsProps = {
    uischema: uiSchema('the rain in Spain stays mainly in the plain.'),
    schema: {},
    rootSchema: {},
    enabled: true,
    config: {},
    path: '',
    visible: true,
  };

  describe('callout control tests', () => {
    it('can render callout', () => {
      const message = 'toot!';
      const props = { ...staticProps, uischema: uiSchema(message) };
      const renderer = render(<GoACalloutControl {...props} />);
      const component = renderer.getByText(message);
      expect(component.getAttribute('type')).toBe('important');
      expect(component.getAttribute('size')).toBe('medium');
    });

    it('will change default type', () => {
      const message = 'woof';
      const props = { ...staticProps, uischema: uiSchema(message, 'information') };
      const { getByText } = render(<GoACalloutControl {...props} />);
      const component = getByText(message);
      expect(component.getAttribute('type')).toBe('information');
    });

    it('will change default size', () => {
      const message = 'woof';
      const props = { ...staticProps, uischema: uiSchema(message, 'information', 'large') };
      const { getByText } = render(<GoACalloutControl {...props} />);
      const component = getByText(message);
      expect(component.getAttribute('size')).toBe('large');
    });

    it('will hide the component when visible is false', () => {
      const message = 'woof';
      const props = { ...staticProps, uischema: uiSchema(message, 'information', 'large') };
      const { getByText } = render(<GoACalloutControl {...{ ...props, visible: false }} />);
      const component = getByText(message);
      expect(component).not.toBeVisible();
    });

    it('will render without componentProps', () => {
      const message = 'woof';
      const props = { ...staticProps, uischema: uiSchema(message, 'information', 'large') };
      props.uischema.options = undefined;

      const { getByText } = render(<GoACalloutControl {...{ ...props, visible: false }} />);
      const component = getByText('unknown');
      expect(component.getAttribute('size')).toBe('medium');
    });
  });
});
