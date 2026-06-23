import React from 'react';
import { render } from '@testing-library/react';
import '@testing-library/jest-dom';
import { JsonForms } from '@jsonforms/react';
import Ajv from 'ajv';
import { GoACells, GoARenderers } from '../../index';
import { UISchemaElement } from '@jsonforms/core';
import { MarkdownComponent, markdownComponents } from './HelpContent';
import * as mdxModule from '@mdx-js/mdx';

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

describe('HelpContentComponent', () => {
  test('renders single-line help content', () => {
    // Arrange
    const uiSchema = {
      type: 'HelpContent',
      scope: '#/properties/helpMe',
      label: 'Poetry',
      options: {
        help: 'The sky is blue',
      },
    };

    // Act
    const { getByText } = render(getForm(uiSchema));

    // Assert
    expect(getByText('The sky is blue')).toBeInTheDocument();
  });

  test('renders multi-line help content', () => {
    // Arrange
    const uiSchema = {
      type: 'HelpContent',
      label: 'Poetry',
      options: {
        help: ['The sky is blue', 'The river is wide'],
      },
    };

    // Act
    const { getByText } = render(getForm(uiSchema));

    // Assert
    expect(getByText('The sky is blue')).toBeInTheDocument();
    expect(getByText('The river is wide')).toBeInTheDocument();
  });

  test('renders nested help content', () => {
    // Arrange
    const uiSchema = {
      type: 'HelpContent',
      label: 'Main Heading',
      elements: [
        {
          type: 'HelpContent',
          label: 'Section Heading',
          options: {
            help: 'This is the help content.',
          },
        },
      ],
    };

    // Act
    const { getByText } = render(getForm(uiSchema));

    // Assert
    expect(getByText('Main Heading')).toBeInTheDocument();
    expect(getByText('Section Heading')).toBeInTheDocument();
    expect(getByText('This is the help content.')).toBeInTheDocument();
  });
});

describe('MarkdownComponent', () => {
  test('renders valid markdown content via ReactMarkdown', () => {
    // Arrange
    const markdown = '# Heading\n\nThis is a **bold** text.';

    // Act
    const { getByTestId } = render(<MarkdownComponent markdown={markdown} />);

    // Assert — react-markdown stub renders a div[data-testid="react-markdown"]
    expect(getByTestId('react-markdown')).toBeInTheDocument();
  });

  test('renders error message when markdown compilation fails', () => {
    // Arrange — force compileSync to throw to exercise the invalid-markdown branch
    jest.spyOn(mdxModule, 'compileSync').mockImplementationOnce(() => {
      throw new Error('unexpected token at position 1');
    });

    // Act
    const { getByText } = render(<MarkdownComponent markdown="some markdown" />);

    // Assert
    expect(getByText(/Help content markdown is invalid:/)).toBeInTheDocument();
  });

  test('renders markdown links to open in a new window', () => {
    // Arrange & Act
    const { getByRole } = render(
      React.createElement(markdownComponents.a, { href: 'https://www.alberta.ca' }, 'Open Alberta'),
    );
    const link = getByRole('link', { name: 'Open Alberta' });

    // Assert
    expect(link).toHaveAttribute('href', 'https://www.alberta.ca');
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noopener noreferrer');
  });
});
