import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { SharepointServiceMain } from './SharepointServiceMain';

describe('SharepointServiceMain', () => {
  it('renders the sharepoint service sample list', () => {
    render(
      <MemoryRouter>
        <SharepointServiceMain tenantName="my-tenant" />
      </MemoryRouter>,
    );
    expect(screen.getByText(/samples for the Sharepoint service/)).toBeTruthy();
    expect(screen.getByText(/Sharepoint service item\s+1/)).toBeTruthy();
  });
});
