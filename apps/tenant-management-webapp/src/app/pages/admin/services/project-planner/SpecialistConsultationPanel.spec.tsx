import React from 'react';
import { render, waitFor } from '@testing-library/react';
import { SpecialistConsultationPanel } from './SpecialistConsultationPanel';
import { expectNoA11yViolations } from './testing/axe';
import { createMockApi } from './testing/createMockApi';
import { ChatSummary, Solution, SpecialistDefinition } from './model';

const solution = (): Solution =>
  ({
    id: 'solution-1',
    name: 'Permit intake',
    scenario: 'new',
    status: 'draft',
    createdByName: 'Pat',
    updatedOn: '2026-03-01T10:00:00.000Z',
    version: 1,
    state: {
      problemStatement: 'Permits',
      concepts: [],
      decisions: [],
      questions: [],
      hypotheses: [],
      specialists: [],
      nextSteps: [],
    },
  }) as Solution;

describe('SpecialistConsultationPanel', () => {
  it('shows service choices beside the specialist chat in the optional accordion', async () => {
    const specialists: SpecialistDefinition[] = [
      {
        service: 'form-service',
        displayName: 'Form service',
        purpose: 'Collect applications',
        workspacePath: '',
        questions: [],
        dependsOn: [],
        risks: [],
        order: 1,
      },
      {
        service: 'file-service',
        displayName: 'File service',
        purpose: 'Store supporting documents',
        workspacePath: '',
        questions: [],
        dependsOn: [],
        risks: [],
        order: 2,
      },
    ];
    const planned = solution();
    planned.state.blueprint = {
      serviceMapping: [
        {
          order: 1,
          service: 'form-service',
          displayName: 'Form service',
          role: 'Collect applications',
          reason: 'Applicants need a form.',
          dependsOn: [],
          capabilities: [],
        },
      ],
    } as NonNullable<Solution['state']['blueprint']>;
    const api = createMockApi();
    const { container } = render(
      <SpecialistConsultationPanel
        solution={planned}
        api={api}
        mode="ai"
        onSolutionChange={jest.fn()}
        specialists={specialists}
      />,
    );
    await waitFor(() => expect(api.listChats).toHaveBeenCalled());

    const expertAccordion = container.querySelector('[testid="optional-experts"]');
    expect(expertAccordion?.getAttribute('heading')).toBe('Chat/Consult with Specialist');
    expect(expertAccordion?.hasAttribute('open')).toBe(false);
    expect(expertAccordion?.querySelector('[testid="specialist-service-form-service"]')?.textContent).toBe('Form');
    expect(expertAccordion?.querySelector('[testid="specialist-service-file-service"]')?.textContent).toBe('File');
    const expertLayout = expertAccordion?.querySelector('[data-testid="service-expert-layout"]');
    expect(expertLayout).not.toBeNull();
    expect(expertLayout?.querySelector('[aria-label="Available service experts"]')).not.toBeNull();
    expect(expertLayout?.querySelector('[data-testid="selected-specialist-chat"]')).not.toBeNull();
    expect(expertLayout?.firstElementChild?.nextElementSibling).toBe(
      expertLayout?.querySelector('[data-testid="selected-specialist-chat"]'),
    );
    expect(expertAccordion?.querySelector('[testid="specialist-service-form-service"]')?.getAttribute('width')).toBe(
      '100%',
    );
    expect(expertAccordion?.querySelector('[data-testid="selected-specialist-chat"] h2')).toBeNull();
    expect(expertAccordion?.querySelector('[data-testid="chat-heading"]')?.textContent).toBe('Form service');
    expect(expertAccordion?.querySelector('[data-testid="chat-context"]')?.textContent).toBe(
      'Recommended for this plan: Applicants need a form.',
    );
    expect(expertAccordion?.textContent).not.toContain('Specialist chat');
  });

  it('shows saved chat counts on the matching specialist buttons', async () => {
    const planned = solution();
    planned.state.blueprint = {
      serviceMapping: [
        {
          order: 1,
          service: 'form-service',
          displayName: 'Form service',
          role: 'Collect applications',
          reason: 'Applicants need a form.',
          dependsOn: [],
          capabilities: [],
        },
      ],
    } as NonNullable<Solution['state']['blueprint']>;
    const savedChats: ChatSummary[] = [
      {
        id: 'form-1',
        service: 'form-service',
        solutionId: planned.id,
        title: 'Form consultation',
        createdOn: '2026-03-01T10:00:00.000Z',
        updatedOn: '2026-03-01T10:00:00.000Z',
        messageCount: 2,
      },
      {
        id: 'form-2',
        service: 'form-service',
        solutionId: planned.id,
        title: 'Form follow-up',
        createdOn: '2026-03-01T10:00:00.000Z',
        updatedOn: '2026-03-01T10:00:00.000Z',
        messageCount: 2,
      },
      {
        id: 'file-1',
        service: 'file-service',
        solutionId: planned.id,
        title: 'File consultation',
        createdOn: '2026-03-01T10:00:00.000Z',
        updatedOn: '2026-03-01T10:00:00.000Z',
        messageCount: 2,
      },
    ];
    const api = createMockApi({ listChats: jest.fn().mockResolvedValue(savedChats) });
    const { container } = render(
      <SpecialistConsultationPanel
        solution={planned}
        api={api}
        mode="ai"
        onSolutionChange={jest.fn()}
        specialists={[
          { service: 'form-service', displayName: 'Form service', purpose: 'Forms', order: 1 } as SpecialistDefinition,
          { service: 'file-service', displayName: 'File service', purpose: 'Files', order: 2 } as SpecialistDefinition,
        ]}
      />,
    );

    await waitFor(() =>
      expect(container.querySelector('[testid="specialist-service-form-service"]')?.textContent).toContain('Form *'),
    );
    expect(container.querySelector('[testid="specialist-service-file-service"]')?.textContent).toBe('File *');
    expect(container.querySelector('[testid="optional-experts-count"]')?.getAttribute('content')).toBe('2 specialists');
  });

  it('shows a message when no service experts are available', async () => {
    const api = createMockApi();
    const { container } = render(
      <SpecialistConsultationPanel solution={solution()} api={api} mode="ai" onSolutionChange={jest.fn()} />,
    );
    await waitFor(() => expect(api.listChats).toHaveBeenCalled());

    expect(container.querySelector('[testid="optional-experts"]')?.textContent).toContain(
      'No service experts are currently available.',
    );
  });

  it('shows a consulting-in-progress message while a blueprint call may be consulting specialists', () => {
    const api = createMockApi();
    const { container } = render(
      <SpecialistConsultationPanel
        solution={solution()}
        api={api}
        mode="ai"
        onSolutionChange={jest.fn()}
        specialists={[
          { service: 'form-service', displayName: 'Form service', purpose: 'Forms', order: 1 } as SpecialistDefinition,
        ]}
        consultingSpecialists
      />,
    );

    expect(container.querySelector('[testid="specialist-auto-consult-progress"]')).toBeTruthy();
    expect(container.querySelector('[testid="optional-experts-consulting"]')?.getAttribute('content')).toBe(
      'Consulting specialists…',
    );
  });

  it('does not show a consulting message when no blueprint call is in flight', () => {
    const api = createMockApi();
    const { container } = render(
      <SpecialistConsultationPanel solution={solution()} api={api} mode="ai" onSolutionChange={jest.fn()} />,
    );

    expect(container.querySelector('[testid="specialist-auto-consult-progress"]')).toBeFalsy();
    expect(container.querySelector('[testid="optional-experts-consulting"]')).toBeFalsy();
  });

  it('passes accessibility checks', async () => {
    const { container } = render(
      <SpecialistConsultationPanel
        solution={solution()}
        api={createMockApi()}
        mode="ai"
        onSolutionChange={jest.fn()}
        specialists={[
          { service: 'form-service', displayName: 'Form service', purpose: 'Forms', order: 1 } as SpecialistDefinition,
        ]}
      />,
    );
    await expectNoA11yViolations(container);
  });
});
