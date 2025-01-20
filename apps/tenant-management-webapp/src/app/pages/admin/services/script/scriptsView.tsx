import React, { useEffect, useState } from 'react';
import { ScriptEditorWrapper } from './editor/scriptEditorWrapper';
import { GoAButton } from '@abgov/react-components-new';

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
        setActiveEdit={setActiveEdit}
      />
    </section>
  );
};
