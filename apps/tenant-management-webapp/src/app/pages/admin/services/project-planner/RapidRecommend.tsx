import React, { FunctionComponent } from 'react';
import ProblemStatement from './ProblemStatement';
import ProposedSolution from './ProposedSolution';
import QuestionsPane from './QuestionsPane';
import RefineChat from './RefineChat';
import SpecialistRail from './SpecialistRail';
import { PaneLayout } from './workplaceLayout';
import { ModeProps } from './workplaceTypes';

export const RapidRecommend: FunctionComponent<ModeProps> = (props) => {
  const { solution, api, mode, layout, specialists, chatCounts, onChatsChanged } = props;

  return (
    <PaneLayout
      layout={layout}
      panes={[
        { id: 1, node: <ProblemStatement {...props} title="1. Problem statement" /> },
        { id: 2, node: <QuestionsPane {...props} title="2. Questions" /> },
        { id: 3, node: <ProposedSolution {...props} title="3. Proposed solution" open /> },
        { id: 4, node: <RefineChat {...props} title="4. Refine by conversation" /> },
        {
          id: 5,
          node: (
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
    />
  );
};

export default RapidRecommend;
