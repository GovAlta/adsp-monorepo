import React from 'react';
import { fireEvent, render } from '@testing-library/react';
import '@testing-library/jest-dom';
import { MemoryRouter, useLocation, useNavigate } from 'react-router-dom';
import { AgentRouter } from './routers';

jest.mock('./agent', () => ({ Agent: () => <div>agent</div> }));
jest.mock('./agentEditor', () => ({ AgentEditor: () => <div>editor</div> }));

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

describe('AgentRouter', () => {
  it('redirects unknown paths to the absolute overview and replaces the history entry', () => {
    const { getByTestId, getByText } = render(
      <MemoryRouter initialEntries={['/dashboard', '/admin/services/agent/unknown/extra']} initialIndex={1}>
        <AgentRouter />
        <Location />
      </MemoryRouter>,
    );
    expect(getByTestId('location')).toHaveTextContent('/admin/services/agent/overview');

    fireEvent.click(getByText('back'));
    expect(getByTestId('location')).toHaveTextContent('/dashboard');
  });

  it('renders the editor for an edit path', () => {
    const { getByText } = render(
      <MemoryRouter initialEntries={['/edit/agent-1']}>
        <AgentRouter />
      </MemoryRouter>,
    );
    expect(getByText('editor')).toBeInTheDocument();
  });
});
