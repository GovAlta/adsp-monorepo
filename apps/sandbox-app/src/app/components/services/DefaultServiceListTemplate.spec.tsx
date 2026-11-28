import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { DefaultServiceListTemplate } from './DefaultServiceListTemplate';

describe('DefaultServiceListTemplate', () => {
  it('renders two items with the default prefix', () => {
    const { container } = render(
      <MemoryRouter>
        <DefaultServiceListTemplate />
      </MemoryRouter>,
    );
    expect(container.querySelectorAll('li')).toHaveLength(2);
    expect(screen.getByText('Item 1')).toBeTruthy();
  });

  it('uses the given prefix', () => {
    render(
      <MemoryRouter>
        <DefaultServiceListTemplate prefix="Event" />
      </MemoryRouter>,
    );
    expect(screen.getByText('Event 2')).toBeTruthy();
  });
});
