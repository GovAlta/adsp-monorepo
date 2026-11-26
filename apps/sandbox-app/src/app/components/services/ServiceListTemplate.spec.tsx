import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ServiceListTemplate } from './ServiceListTemplate';

describe('ServiceListTemplate', () => {
  it('renders a link for each service page', () => {
    render(
      <MemoryRouter>
        <ServiceListTemplate
          servicePages={[
            { id: 'one', name: 'Page one', url: '/one', testId: 'page-one' },
            { id: 'two', name: 'Page two', url: '/two', testId: 'page-two' },
          ]}
        />
      </MemoryRouter>,
    );
    expect(screen.getByTestId('page-one').getAttribute('href')).toBe('/one');
    expect(screen.getByText('Page two').getAttribute('href')).toBe('/two');
  });
});
