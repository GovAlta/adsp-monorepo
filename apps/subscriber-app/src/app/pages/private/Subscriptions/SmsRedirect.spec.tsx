import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import SmsRedirect from './SmsRedirect';

describe('SmsRedirect', () => {
  it('redirects to the realm login with the sms code', () => {
    render(
      <MemoryRouter initialEntries={['/subscriptions/my-realm/sms/123456']}>
        <Routes>
          <Route path="/subscriptions/:realm/sms/:code" element={<SmsRedirect />} />
          <Route path="/:realm/login" element={<div data-testid="login">login</div>} />
        </Routes>
      </MemoryRouter>,
    );
    expect(screen.getByTestId('login')).toBeTruthy();
  });
});
