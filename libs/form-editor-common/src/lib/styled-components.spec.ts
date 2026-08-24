import React from 'react';
import { render } from '@testing-library/react';
import '@testing-library/jest-dom';
import { FormPreviewContainer } from './styled-components';

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
