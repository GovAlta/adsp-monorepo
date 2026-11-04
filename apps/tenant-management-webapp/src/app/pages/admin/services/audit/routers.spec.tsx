import React from 'react';
import { fireEvent, render } from '@testing-library/react';
import '@testing-library/jest-dom';
import { MemoryRouter, useLocation, useNavigate } from 'react-router-dom';
import { AuditRouter } from './routers';

jest.mock('./audit', () => ({ Audit: () => <div>audit</div> }));
jest.mock('./eventPage', () => ({ AuditEventPage: () => <div>event</div> }));

const Location = () => {
  const location = useLocation();
  const navigate = useNavigate();
  return (
    <>
      <div data-testid="location">{location.pathname}</div>
      <button onClick={() => navigate(-1)}>back</button>
    </>
  );
};

describe('AuditRouter', () => {
  it('redirects to overview by replacing the history entry so Back leaves the page', () => {
    const { getByTestId, getByText } = render(
      <MemoryRouter initialEntries={['/dashboard', '/audit/unknown/extra']} initialIndex={1}>
        <AuditRouter />
        <Location />
      </MemoryRouter>,
    );
    expect(getByTestId('location').textContent).toMatch(/overview$/);

    fireEvent.click(getByText('back'));
    expect(getByTestId('location')).toHaveTextContent('/dashboard');
  });
});
