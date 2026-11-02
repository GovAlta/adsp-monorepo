import React from 'react';
import { render } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ReviewHeader, ReviewLabel, ReviewValue } from './style-component';
import { BackButton } from '../FormStepper/BackButton';
import { PageBorder, ReviewItemSection } from '../FormStepper/styled-components';
import { ReviewRow, ReviewRowLabel, ReviewRowValue } from '../ObjectArray/styled-components';

// jsdom ignores media queries, so the narrow-screen rules are checked in the generated CSS text.
const css = () =>
  Array.from(document.querySelectorAll('style'))
    .map((style) => style.textContent ?? '')
    .join('\n')
    .replace(/\s+/g, ' ');

describe('review layout on narrow screens', () => {
  it('wraps long unbroken values', () => {
    const { getByTestId } = render(
      <>
        <ReviewValue data-testid="value">x</ReviewValue>
        <ReviewRowValue data-testid="row-value">x</ReviewRowValue>
      </>,
    );

    expect(getComputedStyle(getByTestId('value')).overflowWrap).toBe('anywhere');
    expect(getComputedStyle(getByTestId('row-value')).overflowWrap).toBe('anywhere');
  });

  it('keeps the Change link on one line and lets the header wrap', () => {
    const { getByTestId } = render(
      <ReviewHeader data-testid="header">
        <ReviewLabel data-testid="label">label</ReviewLabel>
        <BackButton text="Change" link={jest.fn()} />
      </ReviewHeader>,
    );

    expect(getComputedStyle(getByTestId('header')).gap).toBe('var(--goa-space-s)');
    expect(getComputedStyle(getByTestId('label')).overflowWrap).toBe('break-word');
    expect(getComputedStyle(getByTestId('back-button-click')).whiteSpace).toBe('nowrap');
    expect(css()).toMatch(/@media \(max-width: ?639px\) ?\{[^}]*flex-wrap: ?wrap/);
  });

  it('reduces section and page padding below 640px', () => {
    render(
      <>
        <ReviewItemSection />
        <PageBorder />
      </>,
    );

    expect(css()).toMatch(/@media \(max-width: ?639px\) ?\{[^}]*padding: ?var\(--goa-space-l\) var\(--goa-space-m\)/);
    expect(css()).toMatch(/@media \(max-width: ?639px\) ?\{[^}]*padding: ?var\(--goa-space-m\) var\(--goa-space-xs\)/);
  });

  it('stacks object-array labels above values below 480px', () => {
    const { getByTestId } = render(
      <ReviewRow data-testid="row">
        <ReviewRowLabel>label</ReviewRowLabel>
        <ReviewRowValue>value</ReviewRowValue>
      </ReviewRow>,
    );

    expect(getComputedStyle(getByTestId('row')).display).toBe('flex');
    expect(css()).toMatch(/@media \(max-width: ?479px\) ?\{[^}]*flex-direction: ?column/);
  });
});
