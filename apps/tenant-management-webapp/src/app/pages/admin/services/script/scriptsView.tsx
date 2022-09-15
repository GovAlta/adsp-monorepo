import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@store/index';
import { UpdateScript, FETCH_SCRIPTS_ACTION, fetchScripts } from '@store/script/actions';
import { ScriptItem, defaultScript } from '@store/script/models';

import { GoAButton } from '@abgov/react-components';
import { FetchRealmRoles } from '@store/tenant/actions';
import { fetchKeycloakServiceRoles } from '@store/access/actions';
import { AddScriptModal } from './AddScriptModal';

import { fetchEventStreams } from '@store/stream/actions';
import { tenantRolesAndClients } from '@store/sharedSelectors/roles';
import { ScriptTableComponent } from './scriptList';
import { ActionState } from '@store/session/models';
import { PageIndicator } from '@components/Indicator';
import { renderNoItem } from '@components/NoItem';

interface AddScriptProps {
  activeEdit: boolean;
}
export const ScriptsView = ({ activeEdit }: AddScriptProps): JSX.Element => {
  const dispatch = useDispatch();
  const [openAddScript, setOpenAddScript] = useState(false);
  const [selectedScript, setSelectedScript] = useState<ScriptItem>(defaultScript);
  const { fetchScriptState } = useSelector((state: RootState) => ({
    fetchScriptState: state.scriptService.indicator?.details[FETCH_SCRIPTS_ACTION] || '',
  }));
  useEffect(() => {
    dispatch(fetchScripts());
    dispatch(FetchRealmRoles());
    dispatch(fetchKeycloakServiceRoles());
    dispatch(fetchEventStreams());
  }, []);
  const tenant = useSelector(tenantRolesAndClients);

  const { scripts } = useSelector((state: RootState) => state.scriptService);

  useEffect(() => {
    if (activeEdit) {
      reset();
      setOpenAddScript(true);
    }
  }, [activeEdit]);

  // eslint-disable-next-line

  const reset = () => {
    setSelectedScript(defaultScript);
    setOpenAddScript(false);
  };

  return (
    <>
      <div>
        <GoAButton
          activeEdit={activeEdit}
          data-testid="add-script-btn"
          onClick={() => {
            setSelectedScript(defaultScript);
            setOpenAddScript(true);
          }}
        >
          Add Script
        </GoAButton>
      </div>
      {fetchScriptState === ActionState.inProcess && <PageIndicator />}
      {fetchScriptState === ActionState.completed && !scripts && renderNoItem('script')}
      {fetchScriptState === ActionState.completed && scripts && (
        <div>
          <ScriptTableComponent scripts={scripts} />
        </div>
      )}

      {openAddScript && (
        <AddScriptModal
          open={true}
          initialValue={selectedScript}
          realmRoles={tenant.realmRoles}
          tenantClients={tenant.tenantClients ? tenant.tenantClients : {}}
          onCancel={() => {
            reset();
          }}
          onSave={(script) => dispatch(UpdateScript(script))}
        />
      )}
    </>
  );
};
