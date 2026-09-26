import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { MemoryRouter } from 'react-router-dom';
import { AdspComponentsMain } from './AdspComponentsMain';
import { addAdspComponentsPages } from '../../utils/servicePageUtils';

describe('AdspComponentsMain', () => {
  test('renders a link for every ADSP components example page', () => {
    // Arrange
    const pages = addAdspComponentsPages('test-tenant');

    // Act
    render(
      <MemoryRouter>
        <AdspComponentsMain tenantName="test-tenant" />
      </MemoryRouter>,
    );

    // Assert
    expect(pages).not.toHaveLength(0);
    pages.forEach((page) => {
      expect(screen.getByTestId(page.testId)).toHaveAttribute('href', page.url);
      expect(screen.getByTestId(page.testId)).toHaveTextContent(page.name);
    });
  });

  test('builds the example page urls for the given tenant', () => {
    // Arrange & Act
    render(
      <MemoryRouter>
        <AdspComponentsMain tenantName="other-tenant" />
      </MemoryRouter>,
    );

    // Assert
    expect(screen.getByTestId('adspThemeExample1')).toHaveAttribute(
      'href',
      '/other-tenant/services/adsp-components/theme',
    );
  });
});
