import { render } from '@testing-library/react';
import '@testing-library/jest-dom';
import { JSONFormPreviewer } from './JsonFormPreviewer';
import { wrapperErrorMsg } from './schemaWrappers';

const data = {
  firstName: 'string',
  lastName: 'string',
  address: {
    street: 'string',
    city: 'string',
    postal: 'string',
  },
};

const validSchema = `{
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

const validPlaceholderText = 'Valid UI Schema';
const validUiSchema = `{
  "type": "VerticalLayout",
  "elements": [
    {
      "type": "Control",
      "scope": "#/properties/firstName",
      "options": {
        "placeholder": "${validPlaceholderText}"
      }
    },
    { "type": "Control", "scope": "#/properties/lastName" }
  ]
}`;

const brokenPlaceholderText = 'Broken UI Schema';
const brokenUiSchema = `{
  "type": "VerticalLayout",
  "elements": toot
  {
    "type": "Control",
    "scope": "#/properties/firstName",
    "options": {
      "placeholder": "${brokenPlaceholderText}"
    }
  },
  { "type": "Control", "scope": "#/properties/lastName" }
  ]
}`;

const fixedPlaceholderText = 'New UI Schema';
const fixedUiSchema = `{
  "type": "VerticalLayout",
  "elements": [
    {
      "type": "Control",
      "scope": "#/properties/firstName",
      "options": {
        "placeholder": "${fixedPlaceholderText}"
      }
    },
    { "type": "Control", "scope": "#/properties/lastName" },
    { "type": "Control", "scope": "#/properties/address/properties/city" }
  ]
}`;

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

const getPreviewer = (schema: string, uiSchema: string, data: object): JSX.Element => {
  return (
    <JSONFormPreviewer
      schema={schema}
      uischema={uiSchema}
      data={data}
      onChange={() => console.log('on change called')}
    />
  );
};

describe(' JsonFormsPreviewer test', () => {
  it('can render a preview', () => {
    // initialize with good ui schema
    const preview = getPreviewer(validSchema, validUiSchema, data);
    const renderer = render(preview);
    const firstName = renderer.getByPlaceholderText(validPlaceholderText);
    expect(firstName).toBeDefined();
  });

  it('renders old preview when new one is broken', () => {
    // initialize with good ui schema
    const preview = getPreviewer(validSchema, validUiSchema, data);
    const renderer = render(preview);

    // Rerender with broken ui schema
    const brokenPreview = getPreviewer(validSchema, brokenUiSchema, data);
    renderer.rerender(brokenPreview);
    const staleFirstName = renderer.getByPlaceholderText(validPlaceholderText);
    expect(staleFirstName).toBeDefined();
    const callout = renderer.getByText(wrapperErrorMsg);
    expect(callout).toBeDefined();
    const brokenFirstName = renderer.queryByPlaceholderText(brokenPlaceholderText);
    expect(brokenFirstName).toBeNull();
  });

  it('renders fixed preview', () => {
    // initialize with good ui schema
    const preview = getPreviewer(validSchema, validUiSchema, data);
    const renderer = render(preview);

    // Re-render with fixed ui schema
    const fixedPreview = getPreviewer(validSchema, fixedUiSchema, data);
    renderer.rerender(fixedPreview);
    const city = renderer.getByPlaceholderText(fixedPlaceholderText);
    expect(city).toBeDefined();
    const removedCallout = renderer.queryByText(wrapperErrorMsg);
    expect(removedCallout).toBeNull();
    const validFirstName = renderer.queryByPlaceholderText(validPlaceholderText);
    expect(validFirstName).toBeNull();
  });
});
