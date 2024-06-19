import React from 'react';
import { render, fireEvent, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { CommentCoreTopicTypesTable } from './commentCoreTopicTypes'; // Update with actual path
import { debug } from 'node:console';
import { CommentTopicTypes, SecurityClassification } from '@store/comment/model';

describe('CoreFileTypeTableRow', () => {
  const mockProps: Record<string, CommentTopicTypes> = {
    coreType: {
      id: '1',
      name: 'Test File Type',
      commenterRoles: ['Subscriber'],
      adminRoles: ['Editor'],
      readerRoles: ['Editor'],
      securityClassification: SecurityClassification.protectedA,
    },
  };

  it('should show and hide core roles with detailed role information on toggle', async () => {
    render(<CommentCoreTopicTypesTable topicTypes={mockProps} />);

    expect(screen.queryByText(/Admin :/)).not.toBeInTheDocument();
    expect(screen.queryByText(/Commenter :/)).not.toBeInTheDocument();
    expect(screen.queryByText(/Reader :/)).not.toBeInTheDocument();
    const ToggleButton = screen.queryByTestId('toggle-details-visibility');
    fireEvent(ToggleButton, new CustomEvent('_click'));
    const read = await screen.getByText('Admin :');
    expect(read).toBeInTheDocument();
    const comment = await screen.getByText('Commenter :');
    expect(comment).toBeInTheDocument();
    const reader = await screen.getByText('Reader :');
    expect(reader).toBeInTheDocument();
    fireEvent(ToggleButton, new CustomEvent('_click'));

    expect(screen.queryByText(/Admin :/)).not.toBeInTheDocument();
    expect(screen.queryByText(/Commenter :/)).not.toBeInTheDocument();
    expect(screen.queryByText(/Reader :/)).not.toBeInTheDocument();
  });
});
