import React, { useEffect } from 'react';

import { GoAButton } from '@abgov/react-components-new';

import { OverviewLayout } from '@components/Overview';
import { useNavigate } from 'react-router-dom';

interface ScriptOverviewProps {
  setActiveEdit: (boolean) => void;
  setActiveIndex: (index: number) => void;
  setOpenAddScript: (boolean) => void;
}

export const ScriptOverview = ({
  setActiveEdit,
  setActiveIndex,
  setOpenAddScript,
}: ScriptOverviewProps): JSX.Element => {
  useEffect(() => {
    setActiveEdit(false);
    setActiveIndex(0);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  const navigate = useNavigate();
  const description = `The script services provides the ability to execute configured Lua scripts. Applications can use this to capture simple logic in configuration. For example, benefits calculations can be configured in a script and executed via the script service API so that policy changes to the formula can implemented through configuration change.`;

  useEffect(() => {
    setOpenAddScript(false);
    navigate('/admin/services/script');
    return () => {
      setOpenAddScript(false);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <OverviewLayout
      description={description}
      addButton={
        <GoAButton
          testId="add-script-btn"
          onClick={() => {
            setOpenAddScript(true);
            setActiveEdit(true);
            navigate('/admin/services/script?scripts=true');
            setOpenAddScript(false);
          }}
        >
          Add script
        </GoAButton>
      }
    />
  );
};
