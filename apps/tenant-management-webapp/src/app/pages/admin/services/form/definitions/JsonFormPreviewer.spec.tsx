import { render } from '@testing-library/react';
import '@testing-library/jest-dom';
import configureStore from 'redux-mock-store';
import { Provider } from 'react-redux';
import { JSONFormPreviewer } from './JsonFormPreviewer';

/**
 * VERY IMPORTANT:  Rendering <JsonForms ... /> does not work unless the following
 * is included.
 */
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

const data = {};

const validDataSchema = `{
  "type": "object",
  "properties": {
    "firstName": {
      "type": "string"
    },
    "lastName": {
      "type": "string"
    },
    "address": {
      "type": "object",
      "properties": {
        "street": {
          "type": "string"
        },
        "city": {
          "type": "string"
        },
        "postal": {
          "type": "string"
        }
      }
    }
  }
}`;

const brokenDataSchema = `{
  "type": "object",
  "properties": {
    "firstName": woof!
      "type": "string"
    },
    "lastName": {
      "type": "string"
    }
  }
}`;

const improperDataSchema = `{
  "improperties": {
    "firstName": {
      "type": "string"
    }
  }
}`;

const validNamePlaceholder = 'Valid UI Schema';
const validUiSchema = `{
  "type": "VerticalLayout",
  "elements": [
    {
      "type": "Control",
      "scope": "#/properties/firstName",
      "options": {
        "placeholder": "${validNamePlaceholder}"
      }
    },
    { "type": "Control", "scope": "#/properties/lastName" }
  ]
}`;

const brokenNamePlaceholder = 'Broken UI Schema';
const brokenUiSchema = `{
  "type": "VerticalLayout",
  "elements": toot
  {
    "type": "Control",
    "scope": "#/properties/firstName",
    "options": {
      "placeholder": "${brokenNamePlaceholder}"
    }
  },
  { "type": "Control", "scope": "#/properties/lastName" }
  ]
}`;

const fixedNamePlaceholder = 'New UI Schema';
const fixedUiSchema = `{
  "type": "VerticalLayout",
  "elements": [
    {
      "type": "Control",
      "scope": "#/properties/firstName",
      "options": {
        "placeholder": "${fixedNamePlaceholder}"
      }
    },
    { "type": "Control", "scope": "#/properties/lastName" },
    { "type": "Control", "scope": "#/properties/address/properties/city" }
  ]
}`;

const getPreviewer = (dataSchema: string, uiSchema: string, data: object): JSX.Element => {
  const mockStore = configureStore([]);
  return (
    <Provider
      store={mockStore({
        form: {
          editor: {
            dataSchema,
            uiSchema,
          },
        },
      })}
    >
      <JSONFormPreviewer
        // dataSchema={schema}
        // uischema={uiSchema}
        data={data}
        onChange={() => console.log('on change called')}
      />
    </Provider>
  );
};

// TODO: the component test should verify that the view can render properly,
// but the schema validation should be verified against the saga or encapsulating util function.
xdescribe('JsonForms Previewer', () => {
  describe('UI Schema Manager', () => {
    it('can render with a valid ui schema', () => {
      const preview = getPreviewer(validDataSchema, validUiSchema, data);
      const renderer = render(preview);
      const firstName = renderer.getByPlaceholderText(validNamePlaceholder);
      expect(firstName).toBeDefined();
    });

    it('can re-render with a broken ui schema', () => {
      // initialize with good ui schema
      const preview = getPreviewer(validDataSchema, validUiSchema, data);
      const renderer = render(preview);

      // Rerender with broken ui schema
      const brokenPreview = getPreviewer(validDataSchema, brokenUiSchema, data);
      renderer.rerender(brokenPreview);
      const staleFirstName = renderer.getByPlaceholderText(validNamePlaceholder);
      expect(staleFirstName).toBeDefined();
      const callout = renderer.getByTestId('form-preview-error-callout');
      expect(callout).toBeDefined();
      const brokenFirstName = renderer.queryByPlaceholderText(brokenNamePlaceholder);
      expect(brokenFirstName).toBeNull();
    });

    it('can re-render when ui-schema is fixed', () => {
      // initialize with good ui schema
      const preview = getPreviewer(validDataSchema, validUiSchema, data);
      const renderer = render(preview);

      // then break it
      const brokenPreview = getPreviewer(validDataSchema, brokenUiSchema, data);
      renderer.rerender(brokenPreview);
      const staleFirstName = renderer.getByPlaceholderText(validNamePlaceholder);
      expect(staleFirstName).toBeDefined();
      const callout = renderer.getByTestId('form-preview-error-callout');
      expect(callout).toBeDefined();

      // then fix it again
      const fixedPreview = getPreviewer(validDataSchema, fixedUiSchema, data);
      renderer.rerender(fixedPreview);
      const fixedName = renderer.getByPlaceholderText(fixedNamePlaceholder);
      expect(fixedName).toBeDefined();
      const removedCallout = renderer.queryByTestId('form-preview-error-callout');
      expect(removedCallout).toBeNull();
      const wrongName = renderer.queryByPlaceholderText(validNamePlaceholder);
      expect(wrongName).toBeNull();
    });

    it('can be initialized with a bad ui-schema', () => {
      const brokenPreview = getPreviewer(validDataSchema, brokenUiSchema, data);
      const renderer = render(brokenPreview);
      const callout = renderer.getByTestId('form-preview-error-callout');
      expect(callout).toBeDefined();

      // Re-render with valid ui schema
      const validPreview = getPreviewer(validDataSchema, validUiSchema, data);
      renderer.rerender(validPreview);
      const firstName = renderer.getByPlaceholderText(validNamePlaceholder);
      expect(firstName).toBeDefined();
      const removedCallout = renderer.queryByTestId('form-preview-error-callout');
      expect(removedCallout).toBeNull();
    });

    describe('Data Schema Manager', () => {
      it('can re-render with broken data schema', () => {
        // initialize with good data schema
        const preview = getPreviewer(validDataSchema, validUiSchema, data);
        const renderer = render(preview);

        // Rerender with broken ui schema
        const brokenPreview = getPreviewer(brokenDataSchema, validUiSchema, data);
        renderer.rerender(brokenPreview);
        const staleFirstName = renderer.getByPlaceholderText(validNamePlaceholder);
        expect(staleFirstName).toBeDefined();
        const callout = renderer.getByTestId('form-preview-error-callout');
        expect(callout).toBeDefined();
        const brokenFirstName = renderer.queryByPlaceholderText(brokenNamePlaceholder);
        expect(brokenFirstName).toBeNull();
      });
    });

    it('can re-render when data schema is fixed', () => {
      // initialize with good ui schema
      const preview = getPreviewer(validDataSchema, validUiSchema, data);
      const renderer = render(preview);

      // then break it
      const brokenPreview = getPreviewer(brokenDataSchema, validUiSchema, data);
      renderer.rerender(brokenPreview);
      const staleFirstName = renderer.getByPlaceholderText(validNamePlaceholder);
      expect(staleFirstName).toBeDefined();
      const callout = renderer.getAllByTestId('form-preview-error-callout');
      expect(callout).toBeDefined();

      // then fix it again
      const fixedPreview = getPreviewer(validDataSchema, validUiSchema, data);
      renderer.rerender(fixedPreview);
      const validName = renderer.getByPlaceholderText(validNamePlaceholder);
      expect(validName).toBeDefined();
      const removedCallout = renderer.queryByTestId('form-preview-error-callout');
      expect(removedCallout).toBeNull();
    });
  });

  it('can be initialized with a bad data schema', () => {
    const brokenPreview = getPreviewer(undefined, validUiSchema, data);
    const renderer = render(brokenPreview);
    const callout = renderer.getByTestId('form-preview-error-callout');
    expect(callout).toBeDefined();
    const noName = renderer.queryByPlaceholderText(validNamePlaceholder);
    expect(noName).toBeNull();
  });

  it('will report improper data semantics', () => {
    const brokenPreview = getPreviewer(improperDataSchema, validUiSchema, data);
    const renderer = render(brokenPreview);
    const callout = renderer.getByTestId('form-preview-error-callout');
    expect(callout.getAttribute('heading')).toBe('Data schema must have "properties"');
    const noName = renderer.queryByPlaceholderText(validNamePlaceholder);
    expect(noName).toBeNull();
  });
});
