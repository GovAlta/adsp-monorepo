import React, { FunctionComponent } from 'react';
import { GoabCallout } from '@abgov/react-components';
import DiscoveryPanel from './DiscoveryPanel';
import ProblemStatement from './ProblemStatement';
import ProposedSolution from './ProposedSolution';
import RefineChat from './RefineChat';
import SpecialistRail from './SpecialistRail';
import { PaneLayout } from './workplaceLayout';
import { ModeProps } from './workplaceTypes';

export const GuidedDiscovery: FunctionComponent<ModeProps> = (props) => {
  const { solution, api, mode, layout, specialists, chatCounts, onChatsChanged, onSolutionChange } = props;
  const discovery = solution.state.discovery;
  const ready = !!discovery?.ready;
  const threshold = discovery?.threshold ?? 50;

  const proposed =
    ready && solution.state.analysis ? (
      <ProposedSolution {...props} title="3. Proposed solution" />
    ) : (
      <>
        <h2>{ready ? '3. Proposed solution' : '3. Proposed solution (after discovery)'}</h2>
        <GoabCallout type="important" heading="Not yet" testId="solution-not-ready">
          The solution is presented once confidence reaches {threshold}%, or when you choose Show solution now.
        </GoabCallout>
      </>
    );

  return (
    <PaneLayout
      layout={layout}
      panes={[
        {
          id: 1,
          node: <ProblemStatement {...props} title="1. Problem statement" />,
        },
        {
          id: 2,
          node: (
            <>
              <h2>2. Discovery conversation</h2>
              <DiscoveryPanel solution={solution} api={api} mode={mode} onSolutionChange={onSolutionChange} />
            </>
          ),
        },
        { id: 3, node: proposed },
        { id: 4, node: ready && <RefineChat {...props} title="4. Refine by conversation" /> },
        {
          id: 5,
          node: ready && (
            <SpecialistRail
              title="5. Consult a specialist"
              solution={solution}
              api={api}
              mode={mode}
              specialists={specialists}
              chatCounts={chatCounts}
              onChatsChanged={onChatsChanged}
            />
          ),
        },
      ]}
      rightIds={[3, 5]}
    />
  );
};

export default GuidedDiscovery;
