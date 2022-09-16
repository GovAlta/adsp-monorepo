import React, { useEffect } from 'react';

import { GoAButton } from '@abgov/react-components';

interface ScriptOverviewProps {
  setActiveEdit: (boolean) => void;
  setActiveIndex: (index: number) => void;
}

export const ScriptOverview = ({ setActiveEdit, setActiveIndex }: ScriptOverviewProps): JSX.Element => {
  useEffect(() => {
    setActiveEdit(false);
    setActiveIndex(0);
  }, []);
  return (
    <div>
      <section>
        <p>
          This script service provides access to script triggers and script publishing. A service script, as defined in
          this study, is a detailed guide for front-line employees to follow during a service encounter. A script
          includes a predetermined set of specific words, phrases, and gestures, as well as other expectations for the
          employee to use during each step of the service process.
        </p>
        <GoAButton
          data-testid="add-script-btn"
          onClick={() => {
            setActiveEdit(true);
          }}
        >
          Add script
        </GoAButton>
      </section>
    </div>
  );
};
