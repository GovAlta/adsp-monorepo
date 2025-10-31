import React, { FunctionComponent, useEffect } from 'react';
import { NoPaddingH2 } from '@components/AppHeader';
import { GoAButton } from '@abgov/react-components';

interface AgentOverviewProps {
  setOpenAddAgent: (val: boolean) => void;
  setActiveIndex: (number: number) => void;
}
export const AgentOverview: FunctionComponent<AgentOverviewProps> = ({ setOpenAddAgent, setActiveIndex }) => {
  useEffect(() => {
    setActiveIndex(0);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div>
      <section>
        <p>Agent service provides configurable AI agents.</p>
        <NoPaddingH2>Agents</NoPaddingH2>

        <p></p>
        <GoAButton
          testId="add-agent"
          onClick={() => {
            setActiveIndex(1);
            setOpenAddAgent(true);
          }}
        >
          Add agent
        </GoAButton>
      </section>
    </div>
  );
};
