import React from 'react';
import { render, waitFor } from '@testing-library/react';
import AccessPage from './access';
import { stubConfig } from '../../../../utils/useConfig';

describe('Access Page', () => {
  beforeAll(() => {
    stubConfig({
      keycloakUrl: 'https://somedomain.mock',
    });
  });

  it('set the keycloak access url', async () => {
    const { queryByTitle } = render(<AccessPage />);

    await waitFor(() => {
      const link = queryByTitle('Keycloak Admin');
      expect(link).not.toBeNull();
      expect(link.getAttribute('href')).toEqual(
        'https://somedomain.mock/auth/admin/core/console'
      );
    });
  });
});
