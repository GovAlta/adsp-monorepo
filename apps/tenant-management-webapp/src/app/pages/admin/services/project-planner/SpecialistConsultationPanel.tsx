import React, { FunctionComponent, useEffect, useState } from 'react';
import { GoabAccordion, GoabBadge, GoabButton, GoabCallout } from '@abgov/react-components';
import styled from 'styled-components';
import { PlannerApi } from './api';
import { AnalysisMode, Solution, SpecialistDefinition } from './model';
import { countChatsByService, SpecialistChat } from './SpecialistChat';

const ExpertLayout = styled.div`
  display: grid;
  width: 100%;
  box-sizing: border-box;
  grid-template-columns: 15rem minmax(0, 1fr);
  gap: 2rem;
  align-items: start;

  @media (max-width: 48rem) {
    grid-template-columns: minmax(0, 1fr);
    gap: 1.5rem;
  }
`;

const ExpertList = styled.div`
  display: grid;
  gap: 0.5rem;
  min-width: 0;
`;

const SpecialistChatPanel = styled.div`
  min-width: 0;

  @media (min-width: 48.01rem) {
    border-left: 1px solid #dcdcdc;
    padding-left: 1.5rem;
  }
`;

interface SpecialistConsultationPanelProps {
  solution: Solution;
  api: PlannerApi;
  mode: AnalysisMode;
  specialists?: SpecialistDefinition[];
  disabled?: boolean;
  consultingSpecialists?: boolean;
  onSolutionChange: (solution: Solution) => void;
  onChatsChanged?: () => void;
}

const serviceName = (service: string, specialists: SpecialistDefinition[]) =>
  specialists.find((specialist) => specialist.service === service)?.displayName.replace(/ service$/i, '') || service;

const plural = (count: number, word: string) => `${count} ${word}${count === 1 ? '' : 's'}`;

const countBadge = (count: number, label: string, testId: string) => (
  <GoabBadge type="information" content={plural(count, label)} testId={testId} />
);

export const SpecialistConsultationPanel: FunctionComponent<SpecialistConsultationPanelProps> = ({
  solution,
  api,
  mode,
  specialists = [],
  disabled = false,
  consultingSpecialists = false,
  onSolutionChange,
  onChatsChanged,
}) => {
  const [selectedSpecialistService, setSelectedSpecialistService] = useState<string>();
  const [chatCounts, setChatCounts] = useState<Record<string, number>>({});
  const [chatCountsError, setChatCountsError] = useState(false);
  const recommendations = solution.state.blueprint?.serviceMapping || [];
  const activeRecommendation =
    recommendations.find((recommendation) => recommendation.service === selectedSpecialistService) ||
    recommendations[0];
  const activeSpecialist =
    specialists.find((specialist) => specialist.service === selectedSpecialistService) ||
    specialists.find((specialist) =>
      recommendations.some((recommendation) => recommendation.service === specialist.service),
    ) ||
    specialists[0];
  const specialistsWithChatsCount = specialists.filter((specialist) => chatCounts[specialist.service] > 0).length;

  useEffect(() => {
    let active = true;
    api
      .listChats({ solutionId: solution.id })
      .then((chats) => {
        if (active) {
          setChatCounts(countChatsByService(chats));
          setChatCountsError(false);
        }
      })
      .catch(() => {
        if (active) {
          setChatCountsError(true);
        }
      });
    return () => {
      active = false;
    };
  }, [api, solution.id, solution.updatedOn]);

  const handleChatsChanged = () => {
    api
      .listChats({ solutionId: solution.id })
      .then((chats) => {
        setChatCounts(countChatsByService(chats));
        setChatCountsError(false);
      })
      .catch(() => setChatCountsError(true));
    onChatsChanged?.();
  };

  return (
    <div style={{ marginTop: '1.5rem' }}>
      <GoabAccordion
        heading="Chat/Consult with Specialist"
        headingContent={
          consultingSpecialists ? (
            <GoabBadge type="information" content="Consulting specialists…" testId="optional-experts-consulting" />
          ) : (
            <span style={{ display: specialistsWithChatsCount > 0 ? undefined : 'none' }}>
              {specialistsWithChatsCount > 0 &&
                countBadge(specialistsWithChatsCount, 'specialist', 'optional-experts-count')}
            </span>
          )
        }
        headingType="filled"
        open={false}
        testId="optional-experts"
      >
        <p>Choose a service expert for help with this solution. Recommended services are marked.</p>
        {consultingSpecialists && (
          <GoabCallout type="information" heading="Consulting specialists" testId="specialist-auto-consult-progress">
            The planner is consulting recommended specialists; any chats below may update once it finishes.
          </GoabCallout>
        )}
        {chatCountsError && (
          <GoabCallout type="important" heading="Saved chat counts unavailable" testId="specialist-chat-counts-error">
            Saved chat counts could not be loaded. You can still open any specialist.
          </GoabCallout>
        )}
        {specialists.length ? (
          <ExpertLayout data-testid="service-expert-layout">
            <ExpertList role="group" aria-label="Available service experts">
              <h3 style={{ margin: 0 }}>Specialists</h3>
              {specialists.map((specialist) => {
                const label = `${serviceName(specialist.service, specialists)}${
                  chatCounts[specialist.service] ? ' *' : ''
                }`;

                return (
                  <GoabButton
                    key={specialist.service}
                    type={activeSpecialist?.service === specialist.service ? 'primary' : 'secondary'}
                    size="compact"
                    width="100%"
                    testId={`specialist-service-${specialist.service}`}
                    onClick={() => setSelectedSpecialistService(specialist.service)}
                  >
                    {label}
                  </GoabButton>
                );
              })}
            </ExpertList>
            {activeSpecialist && (
              <SpecialistChatPanel data-testid="selected-specialist-chat">
                <SpecialistChat
                  service={activeSpecialist.service}
                  specialist={activeSpecialist}
                  solution={solution}
                  api={api}
                  mode={mode}
                  disabled={disabled}
                  context={{
                    label:
                      activeRecommendation?.service === activeSpecialist.service
                        ? 'Recommended for this plan'
                        : 'Purpose',
                    description:
                      activeRecommendation?.service === activeSpecialist.service
                        ? activeRecommendation.reason
                        : activeSpecialist.purpose,
                  }}
                  onChatsChanged={handleChatsChanged}
                  onSolutionChange={onSolutionChange}
                />
              </SpecialistChatPanel>
            )}
          </ExpertLayout>
        ) : (
          <p>No service experts are currently available.</p>
        )}
      </GoabAccordion>
    </div>
  );
};

export default SpecialistConsultationPanel;
