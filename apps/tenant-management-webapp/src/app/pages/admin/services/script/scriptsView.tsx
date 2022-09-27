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
import { ScriptEditor } from './editor/scriptEditor';
import { Modal, BodyGlobalStyles, ModalContent, ScriptPanelContainer } from './styled-components';
import { useValidators } from '@lib/useValidators';
import { characterCheck, validationPattern, isNotEmptyCheck, Validator } from '@lib/checkInput';
import { scriptEditorConfig } from './editor/config';

interface AddScriptProps {
  activeEdit: boolean;
}
export const ScriptsView = ({ activeEdit }: AddScriptProps): JSX.Element => {
  const dispatch = useDispatch();
  const [openAddScript, setOpenAddScript] = useState(false);
  const [openEditScript, setOpenEditScript] = useState(false);
  const [showTemplateForm, setShowTemplateForm] = useState(false);
  const [selectedScript, setSelectedScript] = useState<ScriptItem>(defaultScript);
  const [errors, setErrors] = useState<Record<string, string>>({});
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
  const checkForBadChars = characterCheck(validationPattern.mixedArrowCaseWithSpace);
  const duplicateScriptCheck = (): Validator => {
    return (name: string) => {
      return scripts[name]
        ? `Duplicated script name ${name}, Please use a different name to get a unique script name`
        : '';
    };
  };
  const descriptionCheck = (): Validator => (description: string) =>
    description.length > 250 ? 'Description should not exceed 250 characters' : '';

  const { validators } = useValidators('name', 'name', checkForBadChars, isNotEmptyCheck('name'))
    .add('duplicated', 'name', duplicateScriptCheck())
    .add('description', 'description', descriptionCheck())
    .build();

  useEffect(() => {
    if (activeEdit) {
      reset();
      setOpenAddScript(true);
    }
  }, [activeEdit]);

  // eslint-disable-next-line

  const reset = (loseEventModal?: boolean) => {
    setSelectedScript(defaultScript);
    setOpenAddScript(false);
    setErrors({});
    setShowTemplateForm(false);
  };
  const saveScript = (script: ScriptItem) => {
    dispatch(UpdateScript(script));
  };
  const saveAndReset = (closeEventModal?: boolean) => {
    saveScript(selectedScript);
    reset(closeEventModal);
  };
  const onEdit = (script) => {
    setSelectedScript(script);
    setOpenEditScript(true);
  };
  const onNameChange = (value) => {
    validators.remove('name');
    const validations = {
      name: value,
    };

    validations['duplicated'] = value;

    validators.checkAll(validations);

    setSelectedScript({ ...selectedScript, name: value });
  };
  const onDescriptionChange = (value) => {
    validators.remove('description');
    validators['description'].check(value);
    setSelectedScript({ ...selectedScript, description: value });
  };
  const onScriptChange = (value) => {
    setSelectedScript({ ...selectedScript, script: value });
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
          Add script
        </GoAButton>
        <br />
        <br />
      </div>
      {fetchScriptState === ActionState.inProcess && <PageIndicator />}
      {fetchScriptState === ActionState.completed && !scripts && renderNoItem('script')}
      {fetchScriptState === ActionState.completed && scripts && (
        <div>
          <ScriptTableComponent scripts={scripts} onEdit={onEdit} />
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
          onSave={saveScript}
        />
      )}

      <Modal open={openEditScript} data-testid="script-edit-form">
        {/* Hides body overflow when the modal is up */}
        <BodyGlobalStyles hideOverflow={openEditScript} />
        <ModalContent>
          <ScriptPanelContainer>
            <ScriptEditor
              modelOpen={showTemplateForm}
              editorConfig={scriptEditorConfig}
              name={selectedScript.name}
              description={selectedScript.description}
              scriptStr={selectedScript.script}
              currentScriptItem={selectedScript}
              onNameChange={onNameChange}
              onDescriptionChange={onDescriptionChange}
              onScriptChange={onScriptChange}
              errors={errors}
              saveAndReset={saveAndReset}
            />
          </ScriptPanelContainer>
          {/* Add preview section */}
        </ModalContent>
      </Modal>
    </>
  );
};
