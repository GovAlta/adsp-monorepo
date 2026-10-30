import React, { FunctionComponent } from 'react';
import { GoabButton } from '@abgov/react-components';
import { NoPaddingH2 } from '@components/AppHeader';

interface PlannerOverviewProps {
  onStart: () => void;
}

export const PlannerOverview: FunctionComponent<PlannerOverviewProps> = ({ onStart }) => (
  <section>
    <p>
      The project planner helps you describe a business problem, identifies common government service needs, and
      recommends which ADSP services could help. Review the plan and adjust it to fit your needs.
    </p>
    <NoPaddingH2>How it works</NoPaddingH2>
    <ol>
      <li>Describe the problem you are trying to solve.</li>
      <li>The planner prepares a draft plan and asks any remaining questions.</li>
      <li>Review the plan and optionally consult service experts.</li>
      <li>Hand off to a service workspace with your solution context.</li>
    </ol>
    <GoabButton size="compact" testId="start-solution" onClick={onStart}>
      Start planning
    </GoabButton>
  </section>
);
