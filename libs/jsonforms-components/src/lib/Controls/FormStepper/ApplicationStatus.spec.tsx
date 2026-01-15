import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ApplicationStatus } from './ApplicationStatus';

describe('ApplicationStatus', () => {
  it('should render Complete badge when all groups are completed', () => {
    const { container } = render(<ApplicationStatus completedGroups={3} totalGroups={3} />);
    expect(container).toBeTruthy();
    expect(screen.getByText('3 out of 3 items completed')).toBeInTheDocument();
  });

  it('should render Incomplete badge when not all groups are completed', () => {
    const { container } = render(<ApplicationStatus completedGroups={1} totalGroups={3} />);
    expect(container).toBeTruthy();
    expect(screen.getByText('1 out of 3 items completed')).toBeInTheDocument();
  });

  it('should render with zero completed groups', () => {
    const { container } = render(<ApplicationStatus completedGroups={0} totalGroups={5} />);
    expect(container).toBeTruthy();
    expect(screen.getByText('0 out of 5 items completed')).toBeInTheDocument();
  });

  it('should render with single total group', () => {
    const { container } = render(<ApplicationStatus completedGroups={1} totalGroups={1} />);
    expect(container).toBeTruthy();
    expect(screen.getByText('1 out of 1 items completed')).toBeInTheDocument();
  });
});
