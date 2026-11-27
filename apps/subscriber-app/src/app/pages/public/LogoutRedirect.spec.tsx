import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import LogoutRedirect from './LogoutRedirect';

describe('LogoutRedirect', () => {
  it('redirects to the root', () => {
    render(
      <MemoryRouter initialEntries={['/logout-redirect']}>
        <Routes>
          <Route path="/logout-redirect" element={<LogoutRedirect />} />
          <Route path="/" element={<div data-testid="root">root</div>} />
        </Routes>
      </MemoryRouter>,
    );
    expect(screen.getByTestId('root')).toBeTruthy();
  });
});
