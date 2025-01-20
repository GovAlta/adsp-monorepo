import { fireEvent, render } from '@testing-library/react';
import '@testing-library/jest-dom';
import { JsonForms } from '@jsonforms/react';
import Ajv from 'ajv';
import { GoACells, GoARenderers } from '../../index';
import { UISchemaElement } from '@jsonforms/core';

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

const ajv = new Ajv({ allErrors: true, verbose: true });

const getForm = (uiSchema: UISchemaElement) => {
  return <JsonForms data={{}} schema={{}} uischema={uiSchema} ajv={ajv} renderers={GoARenderers} cells={GoACells} />;
};

describe('Help Content Control', () => {
  it('will render single line help content', () => {
    const uiSchema = {
      type: 'HelpContent',
      scope: '#/properties/helpMe',
      label: 'Poetry',
      options: {
        help: 'The sky is blue',
      },
    };
    const form = getForm(uiSchema);
    const renderer = render(form);
    const helpComponent = renderer.getByText(uiSchema.options?.help);
    expect(helpComponent).toBeInTheDocument();
  });

  it('will render multi line help content', () => {
    const helpSchema = {
      type: 'HelpContent',
      label: 'Poetry',
      options: {
        help: ['The sky is blue', 'The river is wide'],
      },
    };
    const form = getForm(helpSchema);
    const renderer = render(form);
    const message1 = helpSchema.options.help[0];
    const m1Component = renderer.getByText(message1);
    expect(m1Component).toBeInTheDocument();

    const message2 = helpSchema.options.help[1];
    const m2Component = renderer.getByText(message2);
    expect(m2Component).toBeInTheDocument();
  });

  it('will render detailed help content', () => {
    const helpSchema = {
      type: 'HelpContent',
      label: 'This is the main heading',
      elements: [
        {
          type: 'HelpContent',
          label: 'This is section heading',
          options: {
            help: 'This is the help content.',
          },
        },
      ],
      options: {
        variant: 'details',
      },
    };
    const form = getForm(helpSchema);
    const renderer = render(form);
    const mainWrapper = renderer.container.querySelector('div > :scope goa-details');
    expect(mainWrapper).not.toBeNull();
    expect(mainWrapper?.getAttribute('heading')).toBe(helpSchema.label);
    const sectionHeader = mainWrapper!.querySelector("div > :scope div[class='child-label']");
    expect(sectionHeader).not.toBeNull();
    expect(sectionHeader?.innerHTML).toBe(`${helpSchema.elements[0].label}<br>`);
    const sectionContent = mainWrapper!.querySelector('div :scope div > p');
    expect(sectionContent).not.toBeNull();
    console.log(sectionContent?.outerHTML);
    expect(sectionContent?.innerHTML).toBe(helpSchema.elements[0].options.help);
  });
  it('will render detailed help content with markdown', () => {
    const helpSchema = {
      type: 'HelpContent',
      label: 'This is the main heading',
      elements: [
        {
          type: 'HelpContent',
          label: 'This is section heading',
          options: {
            help: 'This is the help content.',
          },
        },
      ],
      options: {
        variant: 'details',
        markdown: true,
      },
    };
    const form = getForm(helpSchema);
    const renderer = render(form);
    const mainWrapper = renderer.container.querySelector('div > :scope goa-details');
    expect(mainWrapper).toBeNull();
  });

  it('will render image in help content', () => {
    const helpSchema = {
      type: 'HelpContent',
      label: 'This is the main heading',
      elements: [
        {
          type: 'HelpContent',
          label: 'This is section heading',
          options: {
            img: 'https://picsum.photos/200/300',
          },
        },
      ],
      options: {
        variant: 'img',
      },
    };
    const form = getForm(helpSchema);
    const renderer = render(form);

    const image = renderer.container.getElementsByTagName('img');

    expect(image[0]).toBeInTheDocument();
  });
});
