import React, { useEffect, useState } from 'react';

import { GoAButton } from '@abgov/react-components-new';

import { OverviewLayout } from '@components/Overview';
import { useNavigate } from 'react-router-dom';
import { ScriptEditorWrapper } from './editor/scriptEditorWrapper';

interface ScriptOverviewProps {
  setActiveEdit: (boolean) => void;
  setActiveIndex: (index: number) => void;
}

export const ScriptOverview = ({ setActiveEdit, setActiveIndex }: ScriptOverviewProps): JSX.Element => {
  const [openModal, setOpenModal] = useState<boolean>(false);

  useEffect(() => {
    setActiveEdit(false);
    setActiveIndex(0);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  const navigate = useNavigate();
  const description = `The script services provides the ability to execute configured Lua scripts. Applications can use this to capture simple logic in configuration. For example, benefits calculations can be configured in a script and executed via the script service API so that policy changes to the formula can implemented through configuration change.`;

  useEffect(() => {
    navigate('/admin/services/script');
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const updateAddScriptModal = (open: boolean) => {
    setOpenModal(open);
  };

  return (
    <>
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

      <ScriptEditorWrapper
        updateOpenAddScriptModal={updateAddScriptModal}
        openAddScriptModal={openModal}
        showScriptTable={false}
        setActiveEdit={setActiveEdit}
      />
    </>
  );
};
