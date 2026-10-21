import React, { FunctionComponent } from 'react';
import { GoabButton } from '@abgov/react-components';
import { NoPaddingH2 } from '@components/AppHeader';

interface PlannerOverviewProps {
  onStart: () => void;
}

export const PlannerOverview: FunctionComponent<PlannerOverviewProps> = ({ onStart }) => (
  <section>
    <p>
      The project planner helps you describe a business problem, recognises common government solution patterns, and
      recommends which ADSP services to use. Recommendations are hypotheses for you to refine, not final designs.
    </p>
    <NoPaddingH2>How it works</NoPaddingH2>
    <ol>
      <li>Describe the problem you are trying to solve.</li>
      <li>The planner builds a model of your problem and matches it to known patterns.</li>
      <li>Review the hypotheses, answer open questions, and consult service specialists.</li>
      <li>Hand off to a service workspace with your solution context.</li>
    </ol>
    <GoabButton size="compact" testId="start-solution" onClick={onStart}>
      Start planning
    </GoabButton>
  </section>
);
