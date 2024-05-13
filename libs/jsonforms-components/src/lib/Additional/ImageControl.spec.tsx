import { fireEvent, render } from '@testing-library/react';
import '@testing-library/jest-dom';
import { JsonForms } from '@jsonforms/react';
import Ajv from 'ajv8';
import { GoACells, GoARenderers, ajv } from '../../index';
import { UISchemaElement } from '@jsonforms/core';
import exp from 'constants';

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

const getForm = (uiSchema: UISchemaElement) => {
  return <JsonForms data={{}} schema={{}} uischema={uiSchema} ajv={ajv} renderers={GoARenderers} cells={GoACells} />;
};

describe('ImageContent Control tests', () => {
  it('will display a working image', () => {
    const uiSchema = {
      type: 'ImageContent',
      scope: '#/properties/myImage',
      options: {
        url: 'https://picsum.photos/200/300',
      },
    };
    const form = getForm(uiSchema);
    const renderer = render(form);
    const imageComponent = renderer.container.getElementsByTagName('img');
    console.log('imageData', imageComponent[0].outerHTML);
    expect(imageComponent[0]).toBeInTheDocument();
  });

  it('image url is empty', () => {
    const uiSchema = {
      type: 'ImageContent',
      scope: '#/properties/myImage',
      options: {
        url: '',
      },
    };
    const form = getForm(uiSchema);
    const renderer = render(form);
    const imageComponent = renderer.container.getElementsByTagName('img');
    expect(imageComponent[0].getAttribute('src')?.length === 0).toBe(true);
  });

  it('can contain image attributes', () => {
    const uiSchema = {
      type: 'ImageContent',
      scope: '#/properties/myImage',
      options: {
        url: 'https://picsum.photos/200/300',
        alt: 'This is a image',
        height: '500',
        width: '400',
      },
    };
    const form = getForm(uiSchema);
    const renderer = render(form);
    const imageComponent = renderer.container.getElementsByTagName('img');

    expect(imageComponent[0].getAttribute('src')?.length === 0).toBe(true);
    expect(imageComponent[0].getAttribute('alt')?.length === 0).toBe(true);
    expect(imageComponent[0].getAttribute('height')?.length === 0).toBe(true);
    expect(imageComponent[0].getAttribute('width')?.length === 0).toBe(true);
  });
});
