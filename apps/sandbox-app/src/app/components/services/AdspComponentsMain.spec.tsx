import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { MemoryRouter } from 'react-router-dom';
import { AdspComponentsMain } from './AdspComponentsMain';

describe('AdspComponentsMain', () => {
  test('links to the theming example for the tenant', () => {
    // Act
    render(
      <MemoryRouter>
        <AdspComponentsMain tenantName="autotest" />
      </MemoryRouter>,
    );

    // Assert
    expect(screen.getByTestId('adspTheming')).toHaveAttribute('href', '/autotest/services/adsp-components/theming');
    expect(screen.getByTestId('adspConversation')).toHaveAttribute(
      'href',
      '/autotest/services/adsp-components/conversation',
    );
  });
});
