import React from 'react';
import { render, fireEvent, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { CoreFileTypeTableRow } from './fileTypesTable'; // Update with actual path
import { debug } from 'node:console';

describe('CoreFileTypeTableRow', () => {
  const mockProps = {
    id: '1',
    name: 'Test File Type',
    readRoles: ['Subscriber'],
    updateRoles: ['Editor'],
    securityClassification: 'Confidential',
    rules: {
      retention: {
        active: true,
        deleteInDays: 365,
        createdAt: '',
      },
    },
    onEdit: jest.fn(),
    onDelete: jest.fn(),
    editId: '',
    anonymousRead: false,
  };

  it('should show and hide core roles with detailed role information on toggle', async () => {
    render(<CoreFileTypeTableRow {...mockProps} />);

    expect(screen.queryByText(/Read :/)).not.toBeInTheDocument();
    expect(screen.queryByText(/Modify :/)).not.toBeInTheDocument();
    const ToggleButton = screen.queryByTestId('configuration-toggle-details-visibility');
    fireEvent(ToggleButton, new CustomEvent('_click'));
    const read = await screen.getByText('Read :');
    expect(read).toBeInTheDocument();
    const modify = await screen.getByText('Modify :');
    expect(modify).toBeInTheDocument();
    fireEvent(ToggleButton, new CustomEvent('_click'));

    expect(screen.queryByText(/Read :/)).not.toBeInTheDocument();
    expect(screen.queryByText(/Modify :/)).not.toBeInTheDocument();
  });
});
