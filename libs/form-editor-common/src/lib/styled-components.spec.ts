import React from 'react';
import { render } from '@testing-library/react';
import '@testing-library/jest-dom';
import { FormPreviewContainer, NameDescriptionDataSchema } from './styled-components';

describe('FormPreviewContainer', () => {
  it('fills the width of the resizable pane it sits in', () => {
    // Arrange
    const { getByTestId } = render(
      React.createElement(FormPreviewContainer, { 'data-testid': 'form-preview-container' }),
    );

    // Act
    const preview = getByTestId('form-preview-container');

    // Assert
    expect(preview).toHaveStyle('width: 100%');
  });

  it('pads the divider side to match the editor pane, so the gap is even', () => {
    // Arrange
    const { getByTestId } = render(
      React.createElement(FormPreviewContainer, { 'data-testid': 'form-preview-container' }),
    );

    // Act
    const preview = getByTestId('form-preview-container');

    // Assert — mirrors NameDescriptionDataSchema's padding-right.
    expect(preview).toHaveStyle('padding-left: 3rem');
    expect(preview).toHaveStyle('box-sizing: border-box');
  });
});

describe('NameDescriptionDataSchema', () => {
  it('pads the divider side while the preview is showing', () => {
    // Arrange
    const { getByTestId } = render(
      React.createElement(NameDescriptionDataSchema, { 'data-testid': 'editor-pane' }),
    );

    // Act
    const pane = getByTestId('editor-pane');

    // Assert
    expect(pane).toHaveStyle('padding-right: 3rem');
  });

  it('drops that padding with the preview hidden, so it does not double the container padding', () => {
    // Arrange
    const { getByTestId } = render(
      React.createElement(NameDescriptionDataSchema, { 'data-testid': 'editor-pane', $previewHidden: true }),
    );

    // Act
    const pane = getByTestId('editor-pane');

    // Assert
    expect(pane).toHaveStyle('padding-right: 0');
  });
});
