import React from 'react';
import { render } from '@testing-library/react';
import '@testing-library/jest-dom';
import { MonacoDivBody } from './styled-components';

describe('MonacoDivBody', () => {
  it('fills the pane that owns its height', () => {
    // Arrange
    const { getByTestId } = render(<MonacoDivBody data-testid="templated-editor-body" />);

    // Act
    const body = getByTestId('templated-editor-body');

    // Assert
    expect(body).toHaveStyle('height: 100%');
  });

  it('stays usable when the pane is short', () => {
    // Arrange
    const { getByTestId } = render(<MonacoDivBody data-testid="templated-editor-body" />);

    // Act
    const body = getByTestId('templated-editor-body');

    // Assert
    expect(body).toHaveStyle('min-height: 200px');
  });
});
