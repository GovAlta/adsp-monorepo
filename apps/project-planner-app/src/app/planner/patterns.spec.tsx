import React from 'react';
import { render } from '@testing-library/react';
import { useSelector } from 'react-redux';
import { Patterns } from './patterns';
import { usePlannerApi } from './api';
import { BusinessPattern } from './model';

jest.mock('./api', () => ({ usePlannerApi: jest.fn() }));
jest.mock('react-redux', () => ({ useSelector: jest.fn() }));

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
    commonFeatures: ['Applicants submit an intake form.'],
    assumptions: ['Records persist beyond initial submission.'],
    clarifyingQuestions: ['Does the submission become a long-lived record after intake?'],
  };
  const permitting: BusinessPattern = {
    ...caseManagement,
    id: 'permitting',
    name: 'Permitting',
    description: 'Issue permits.',
    clarifyingQuestions: [],
  };

  const withRoles = (roles?: string[]) =>
    (useSelector as jest.Mock).mockImplementation((selector) =>
      selector({ session: { resourceAccess: roles ? { 'urn:ads:platform:project-planner-service': { roles } } : undefined } })
    );

  beforeEach(() => {
    withRoles();
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

  it('lists each mapped service with its reason', async () => {
    const { findAllByText } = render(<Patterns />);

    expect(await findAllByText('form-service')).toHaveLength(2);
  });

  it('shows clarifying questions for patterns that have them', async () => {
    const { findByText } = render(<Patterns />);

    expect(await findByText('Does the submission become a long-lived record after intake?')).toBeTruthy();
  });

  it('shows common features and assumptions when provided', async () => {
    const { findAllByText } = render(<Patterns />);
    await findAllByText('Applicants submit an intake form.');

    expect(await findAllByText('Records persist beyond initial submission.')).toHaveLength(2);
  });

  it('omits sections that have no items', async () => {
    const { container, findByText } = render(<Patterns />);
    await findByText('Permitting');

    expect(container.querySelectorAll('goa-details[heading="Clarifying questions"]')).toHaveLength(1);
  });

  it('renders the table with no rows when loading patterns fails', async () => {
    api.listPatterns.mockRejectedValue(new Error('Network Error'));

    const { container, findByText } = render(<Patterns />);
    await findByText(/Business patterns the planner uses/);

    expect(container.querySelectorAll('tbody tr')).toHaveLength(0);
  });

  it('does not offer editing to users without the planner-admin role', async () => {
    withRoles(['planner-user']);

    const { container, findByText } = render(<Patterns />);
    await findByText('Permitting');

    expect(container.querySelector('goa-button[testid="pattern-new"]')).toBeNull();
  });

  it('offers editing to planner admins', async () => {
    withRoles(['planner-admin']);

    const { container, findByText } = render(<Patterns />);
    await findByText('Permitting');

    expect(container.querySelector('goa-button[testid="pattern-new"]')).not.toBeNull();
  });});
