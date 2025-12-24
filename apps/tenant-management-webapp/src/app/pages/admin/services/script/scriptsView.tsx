import React, { useEffect, useState } from 'react';
import { ScriptEditorWrapper } from './editor/scriptEditorWrapper';
import { GoabButton } from '@abgov/react-components';

interface ScriptsViewProps {
  setActiveEdit: (boolean) => void;
  setActiveIndex: (index: number) => void;
  activeEdit: boolean;
}
export const ScriptsView = ({ setActiveEdit, activeEdit }: ScriptsViewProps): JSX.Element => {
  const [openAddScript, setOpenAddScript] = useState(false);

  const updateAddScriptModal = (open: boolean) => {
    setOpenAddScript(open);
  };

  useEffect(() => {
    if (activeEdit) {
      reset();
      setOpenAddScript(true);
    }
  }, [activeEdit]);

  const reset = () => {
    setOpenAddScript(false);
    document.body.style.overflow = 'unset';
  };
  return (
    <section>
      <div>
        <GoabButton
          testId="add-script-btn"
          onClick={() => {
            setOpenAddScript(true);
          }}
        >
          Add script
        </GoabButton>
        <br />
        <br />
      </div>
      <ScriptEditorWrapper
        updateOpenAddScriptModal={updateAddScriptModal}
        openAddScriptModal={openAddScript}
        showScriptTable={true}
        setActiveEdit={setActiveEdit}
      />
    </section>
  );
};
