import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { AdspThemes } from '@core-services/adsp-components-core';
import { AdspThemeExampleOne } from './AdspThemeExampleOne';

describe('AdspThemeExampleOne', () => {
  it('renders the card without a provider using the standard theme', () => {
    render(<AdspThemeExampleOne />);
    expect(screen.getByTestId('adspThemeCardDefault')).toHaveStyle({
      background: AdspThemes.standard.color.surface.card,
    });
  });

  it('styles the unprovided and explicitly standard cards identically', () => {
    render(<AdspThemeExampleOne />);
    const fallback = screen.getByTestId('adspThemeCardDefault');
    const explicit = screen.getByTestId('adspThemeCardStandard');

    expect(explicit.getAttribute('style')).toBe(fallback.getAttribute('style'));
  });

  it('styles the card under a different theme differently', () => {
    render(<AdspThemeExampleOne />);
    const standard = screen.getByTestId('adspThemeCardStandard');
    const demo = screen.getByTestId('adspThemeCardDemo');

    expect(demo.getAttribute('style')).not.toBe(standard.getAttribute('style'));
  });
});
