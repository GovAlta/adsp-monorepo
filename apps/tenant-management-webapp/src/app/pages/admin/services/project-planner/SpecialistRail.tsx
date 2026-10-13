import React, { FunctionComponent, useState } from 'react';
import { GoabButton } from '@abgov/react-components';
import styled from 'styled-components';
import { PlannerApi } from './api';
import { AnalysisMode, Solution, SpecialistDefinition } from './model';
import { SpecialistChat } from './SpecialistChat';

const Rail = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem;
  margin-bottom: 1rem;
`;

const railName = (specialist: SpecialistDefinition) => specialist.displayName.replace(/ service$/i, '');

interface SpecialistRailProps {
  title: string;
  solution: Solution;
  api: PlannerApi;
  mode: AnalysisMode;
  specialists: SpecialistDefinition[];
  chatCounts: Record<string, number>;
  onChatsChanged: () => void;
}

export const SpecialistRail: FunctionComponent<SpecialistRailProps> = ({
  title,
  solution,
  api,
  mode,
  specialists,
  chatCounts,
  onChatsChanged,
}) => {
  const [selected, setSelected] = useState<string>();
  const specialist = specialists.find((s) => s.service === selected);

  return (
    <div data-testid="specialist-rail">
      <h2>{title}</h2>
      {specialists.length === 0 && <p>No specialists available.</p>}
      <Rail role="group" aria-label="Specialists">
        {specialists.map((s) => {
          const count = chatCounts[s.service] || 0;
          return (
            <GoabButton
              key={s.service}
              type={selected === s.service ? 'primary' : 'secondary'}
              size="compact"
              testId={`specialist-${s.service}`}
              onClick={() => setSelected(s.service)}
            >
              {count > 0 ? <strong>{`${railName(s)} (${count})`}</strong> : railName(s)}
            </GoabButton>
          );
        })}
      </Rail>
      {selected ? (
        <SpecialistChat
          key={selected}
          service={selected}
          specialist={specialist}
          solution={solution}
          api={api}
          mode={mode}
          onChatsChanged={onChatsChanged}
        />
      ) : (
        <p data-testid="specialist-hint">
          Choose a specialist to ask questions, get recommendations, refine a design, validate a plan or get sample code. Conversations are
          saved with this solution.
        </p>
      )}
    </div>
  );
};

export default SpecialistRail;
