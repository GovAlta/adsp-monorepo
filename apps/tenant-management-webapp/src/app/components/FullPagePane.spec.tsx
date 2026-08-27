import React from 'react';
import { fireEvent, render } from '@testing-library/react';
import '@testing-library/jest-dom';
import { FullPagePane } from './FullPagePane';

const toggle = (baseElement: Element) => baseElement.querySelector("goa-icon-button[testid='pdf-body-toggle']");

const renderPane = () =>
  render(
    <FullPagePane label="Body" testId="pdf-body" height="calc(100vh - 356px)">
      <div>Editor</div>
    </FullPagePane>,
  );

describe('FullPagePane', () => {
  it('starts at regular size with the height it was given', () => {
    // Arrange
    const { baseElement, getByTestId } = renderPane();

    // Act
    const pane = getByTestId('pdf-body');

    // Assert
    expect(pane).toHaveStyle('height: calc(100vh - 356px)');
    expect(toggle(baseElement)).toHaveAttribute('icon', 'expand');
  });

  it('puts the editor into full page mode', () => {
    // Arrange
    const { baseElement, getByTestId } = renderPane();

    // Act
    fireEvent(toggle(baseElement), new CustomEvent('_click'));

    // Assert
    expect(getByTestId('pdf-body')).toHaveAttribute('data-full-page', 'true');
    expect(toggle(baseElement)).toHaveAttribute('icon', 'contract');
  });

  it('returns the editor to regular size', () => {
    // Arrange
    const { baseElement, getByTestId } = renderPane();
    fireEvent(toggle(baseElement), new CustomEvent('_click'));

    // Act
    fireEvent(toggle(baseElement), new CustomEvent('_click'));

    // Assert
    expect(getByTestId('pdf-body')).toHaveAttribute('data-full-page', 'false');
    expect(getByTestId('pdf-body')).toHaveStyle('height: calc(100vh - 356px)');
  });

  it('returns the editor to regular size on escape', () => {
    // Arrange
    const { baseElement, getByTestId } = renderPane();
    fireEvent(toggle(baseElement), new CustomEvent('_click'));

    // Act
    fireEvent.keyDown(getByTestId('pdf-body'), { key: 'Escape' });

    // Assert
    expect(getByTestId('pdf-body')).toHaveAttribute('data-full-page', 'false');
  });

  it('keeps the editor mounted through the switch to full page', () => {
    // Arrange
    const { baseElement, getByText } = renderPane();
    const editor = getByText('Editor');

    // Act
    fireEvent(toggle(baseElement), new CustomEvent('_click'));

    // Assert
    expect(getByText('Editor')).toBe(editor);
  });

  it('puts an optional heading on the same row as the toggle', () => {
    // Arrange
    const { baseElement, getByText } = render(
      <FullPagePane label="Body" heading="Body" testId="pdf-body">
        <div>Editor</div>
      </FullPagePane>,
    );

    // Act
    const heading = getByText('Body');

    // Assert
    expect(heading.parentElement).toContainElement(toggle(baseElement) as HTMLElement);
  });
});
