import React from 'react';
import { render } from '@testing-library/react';
import { Patterns } from './patterns';
import { usePlannerApi } from './api';
import { BusinessPattern } from './model';

jest.mock('./api', () => ({ usePlannerApi: jest.fn() }));

describe('Patterns', () => {
  const api = { listPatterns: jest.fn() };
  const caseManagement: BusinessPattern = {
    id: 'case-management',
    name: 'Case Management',
    description: 'Manage records moving through a lifecycle.',
    domainLanguage: ['case'],
    serviceMappings: [
      { service: 'form-service', reason: 'Intake forms.' },
      { service: 'task-service', reason: 'Assignment of work.' },
    ],
    clarifyingQuestions: ['Does the submission become a long-lived record after intake?'],
  };
  const permitting: BusinessPattern = {
    ...caseManagement,
    id: 'permitting',
    name: 'Permitting',
    description: 'Issue permits.',
    clarifyingQuestions: [],
  };

  beforeEach(() => {
    (usePlannerApi as jest.Mock).mockReturnValue(api);
    api.listPatterns.mockResolvedValue([caseManagement, permitting]);
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('shows a loading indicator while patterns are loading', () => {
    api.listPatterns.mockReturnValue(new Promise(() => undefined));

    const { container } = render(<Patterns />);

    expect(container.querySelector('goa-circular-progress')).not.toBeNull();
  });

  it('lists each pattern name', async () => {
    const { findByText } = render(<Patterns />);

    expect(await findByText('Case Management')).toBeTruthy();
  });

  it('lists a row for every pattern', async () => {
    const { container, findByText } = render(<Patterns />);
    await findByText('Permitting');

    expect(container.querySelectorAll('tbody tr')).toHaveLength(2);
  });

  it('shows the pattern description', async () => {
    const { findByText } = render(<Patterns />);

    expect(await findByText('Issue permits.')).toBeTruthy();
  });

  it('joins the mapped services into one cell', async () => {
    const { findAllByText } = render(<Patterns />);

    expect(await findAllByText('form-service, task-service')).toHaveLength(2);
  });

  it('shows clarifying questions for patterns that have them', async () => {
    const { findByText } = render(<Patterns />);

    expect(await findByText('Does the submission become a long-lived record after intake?')).toBeTruthy();
  });

  it('omits the clarifying questions section for patterns without questions', async () => {
    const { container, findByText } = render(<Patterns />);
    await findByText('Permitting');

    expect(container.querySelectorAll('goa-details')).toHaveLength(1);
  });

  it('renders the table with no rows when loading patterns fails', async () => {
    api.listPatterns.mockRejectedValue(new Error('Network Error'));

    const { container, findByText } = render(<Patterns />);
    await findByText(/Business patterns the planner uses/);

    expect(container.querySelectorAll('tbody tr')).toHaveLength(0);
  });
});
