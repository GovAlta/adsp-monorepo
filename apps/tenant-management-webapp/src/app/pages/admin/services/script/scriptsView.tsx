import React, { useState } from 'react';
import { ScriptEditorWrapper } from './editor/scriptEditorWrapper';
import { GoAButton } from '@abgov/react-components-new';

export const ScriptsView = (): JSX.Element => {
  const [openAddScript, setOpenAddScript] = useState(false);

  const updateAddScriptModal = (open: boolean) => {
    setOpenAddScript(open);
  };
  return (
    <section>
      <div>
        <GoAButton
          testId="add-script-btn"
          onClick={() => {
            setOpenAddScript(true);
          }}
        >
          Add script
        </GoAButton>
        <br />
        <br />
      </div>
      <ScriptEditorWrapper
        updateOpenAddScriptModal={updateAddScriptModal}
        openAddScriptModal={openAddScript}
        showScriptTable={true}
      />
    </section>
  );
};
