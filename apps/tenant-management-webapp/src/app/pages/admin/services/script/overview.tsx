import React, { useEffect } from 'react';

import { GoAButton } from '@abgov/react-components-new';

import { OverviewLayout } from '@components/Overview';

interface ScriptOverviewProps {
  setActiveEdit: (boolean) => void;
  setActiveIndex: (index: number) => void;
}

export const ScriptOverview = ({ setActiveEdit, setActiveIndex }: ScriptOverviewProps): JSX.Element => {
  useEffect(() => {
    setActiveEdit(false);
    setActiveIndex(0);
  }, [setActiveEdit, setActiveIndex]);

  const description = `The script services provides the ability to execute configured Lua scripts. Applications can use this to capture simple logic in configuration. For example, benefits calculations can be configured in a script and executed via the script service API so that policy changes to the formula can implemented through configuration change.`;
  return (
    <OverviewLayout
      description={description}
      addButton={
        <GoAButton
          testId="add-script-btn"
          onClick={() => {
            setActiveEdit(true);
          }}
        >
          Add script
        </GoAButton>
      }
    />
  );
};
