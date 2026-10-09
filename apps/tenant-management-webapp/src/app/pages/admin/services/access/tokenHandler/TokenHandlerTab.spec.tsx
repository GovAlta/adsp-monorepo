import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { TokenHandlerTab } from './TokenHandlerTab';

jest.mock('./TokenHandlerClientList', () => ({
  TokenHandlerClientList: ({ onSelect }: { onSelect: (id: string) => void }) => (
    <button data-testid="select-client" onClick={() => onSelect('my-client')} />
  ),
}));
jest.mock('./TokenHandlerClientDetail', () => ({
  TokenHandlerClientDetail: ({ clientId, onBack }: { clientId: string; onBack: () => void }) => (
    <button data-testid="client-detail" onClick={onBack}>
      {clientId}
    </button>
  ),
}));

describe('TokenHandlerTab', () => {
  it('shows the client list initially', () => {
    render(<TokenHandlerTab />);
    expect(screen.getByTestId('select-client')).toBeTruthy();
  });

  it('shows the selected client and returns to the list on back', () => {
    render(<TokenHandlerTab />);
    fireEvent.click(screen.getByTestId('select-client'));
    expect(screen.getByTestId('client-detail').textContent).toBe('my-client');

    fireEvent.click(screen.getByTestId('client-detail'));
    expect(screen.getByTestId('select-client')).toBeTruthy();
  });

  it('starts at the list again after being remounted', () => {
    const { unmount } = render(<TokenHandlerTab />);
    fireEvent.click(screen.getByTestId('select-client'));
    unmount();

    render(<TokenHandlerTab />);
    expect(screen.getByTestId('select-client')).toBeTruthy();
  });
});
