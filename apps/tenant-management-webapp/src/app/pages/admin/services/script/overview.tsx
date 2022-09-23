import React, { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { GoAButton } from '@abgov/react-components';
import { FetchRealmRoles } from '@store/tenant/actions';
interface ScriptOverviewProps {
  setActiveEdit: (boolean) => void;
  setActiveIndex: (index: number) => void;
}

export const ScriptOverview = ({ setActiveEdit, setActiveIndex }: ScriptOverviewProps): JSX.Element => {
  const dispatch = useDispatch();
  useEffect(() => {
    dispatch(FetchRealmRoles());
  }, []);

  useEffect(() => {
    setActiveEdit(false);
    setActiveIndex(0);
  }, []);
  return (
    <div>
      <section>
        <p>
          The script services provides the ability to execute configured Lua scripts. Applications can use this to
          capture simple logic in configuration. For example, benefits calculations can be configured in a script and
          executed via the script service API so that policy changes to the formula can implemented through
          configuration change.
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
