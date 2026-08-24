import React from 'react';
import { render } from '@testing-library/react';
import '@testing-library/jest-dom';
import { SplitPanePanel } from './styled-components';

describe('SplitPanePanel', () => {
  it('removes a collapsed pane from the visible layout', () => {
    // Arrange
    const { getByTestId } = render(<SplitPanePanel data-testid="collapsed-pane" $collapsed />);

    // Act
    const pane = getByTestId('collapsed-pane');

    // Assert
    expect(pane).toHaveStyle('display: none');
  });

  it('fills the available space when configured as the flexible pane', () => {
    // Arrange
    const { getByTestId } = render(<SplitPanePanel data-testid="fill-pane" $fill />);

    // Act
    const pane = getByTestId('fill-pane');

    // Assert
    expect(pane).toHaveStyle('flex: 1 1 0');
  });
});
