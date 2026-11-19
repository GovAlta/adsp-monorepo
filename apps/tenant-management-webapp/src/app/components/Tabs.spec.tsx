import React from 'react';
import { fireEvent, render } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Tab, Tabs } from './Tabs';

const renderTabs = (onChange = jest.fn()) =>
  render(
    <Tabs activeIndex={0} changeTabCallback={onChange}>
      <Tab label="First">First content</Tab>
      <Tab label="Roles" disabled disabledReason="Roles couldn't be loaded">
        Roles content
      </Tab>
    </Tabs>,
  );

describe('Tabs', () => {
  it('switches to an enabled tab when it is clicked', () => {
    // Arrange
    const onChange = jest.fn();
    const { getByTestId, getByText } = render(
      <Tabs activeIndex={0} changeTabCallback={onChange}>
        <Tab label="First">First content</Tab>
        <Tab label="Second">Second content</Tab>
      </Tabs>,
    );

    // Act
    fireEvent.click(getByTestId('tab-btn-1'));

    // Assert
    expect(onChange).toHaveBeenCalledWith(1);
    expect(getByText('Second content')).toBeInTheDocument();
  });

  it('greys out a disabled tab and shows the reason on hover', () => {
    // Arrange / Act
    const { getByTestId } = renderTabs();

    // Assert
    const roles = getByTestId('tab-btn-1');
    expect(roles).toHaveClass('disabled');
    expect(roles).toHaveAttribute('aria-disabled', 'true');
    expect(roles).toHaveAttribute('title', "Roles couldn't be loaded");
  });

  it('does not switch to a disabled tab when it is clicked', () => {
    // Arrange
    const onChange = jest.fn();
    const { getByTestId, getByText, queryByText } = renderTabs(onChange);

    // Act
    fireEvent.click(getByTestId('tab-btn-1'));

    // Assert
    expect(onChange).not.toHaveBeenCalled();
    expect(getByText('First content')).toBeInTheDocument();
    expect(queryByText('Roles content')).not.toBeInTheDocument();
  });
});
