import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@store/index';
import { UpdateScript, FETCH_SCRIPTS_ACTION, fetchScripts } from '@store/script/actions';
import { ScriptItem, defaultScript } from '@store/script/models';

import { GoAButton } from '@abgov/react-components-new';
import { FetchRealmRoles } from '@store/tenant/actions';
import { fetchKeycloakServiceRoles } from '@store/access/actions';
import { AddScriptModal } from './addScriptModal';
import { fetchEventStreams } from '@store/stream/actions';
import { ScriptTableComponent } from './scriptList';
import { ActionState } from '@store/session/models';
import { PageIndicator } from '@components/Indicator';
import { renderNoItem } from '@components/NoItem';
import { ScriptEditor } from './editor/scriptEditor';
import {
  Modal,
  BodyGlobalStyles,
  ModalContent,
  ScriptPanelContainer,
  HideTablet,
  OuterNotificationTemplateEditorContainer,
} from './styled-components';
import { useValidators } from '@lib/validation/useValidators';
import { isNotEmptyCheck, isValidJSONCheck, wordMaxLengthCheck, badCharsCheck } from '@lib/validation/checkInput';
import { TabletMessage } from '@components/TabletMessage';

interface AddScriptProps {
  activeEdit: boolean;
}

export const ScriptsView = ({ activeEdit }: AddScriptProps): JSX.Element => {
  const getDefaultTestInput = () => {
    // Oct-27-2022 Paul: we might need to update the default input in the feature.
    return JSON.stringify({ testVariable: 'some data' });
  };
  const dispatch = useDispatch();
  const [openAddScript, setOpenAddScript] = useState(false);
  const [showScriptEditForm, setShowScriptEditForm] = useState(false);
  const [selectedScript, setSelectedScript] = useState<ScriptItem>(defaultScript);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [script, setScript] = useState('');
  const [testInput, setTestInput] = useState(JSON.stringify({ testVariable: 'some data' }, null, 2));
  const { fetchScriptState } = useSelector((state: RootState) => ({
    fetchScriptState: state.scriptService.indicator?.details[FETCH_SCRIPTS_ACTION] || '',
  }));

  const goBack = () => {
    setShowScriptEditForm(false);
  };

  const latestNotification = useSelector(
    (state: RootState) => state.notifications.notifications[state.notifications.notifications.length - 1]
  );
  const isNotificationActive = latestNotification && !latestNotification.disabled;

  useEffect(() => {
    dispatch(fetchScripts());
    dispatch(FetchRealmRoles());
    dispatch(fetchKeycloakServiceRoles());
    dispatch(fetchEventStreams());
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const { scripts } = useSelector((state: RootState) => state.scriptService);
  const { errors, validators } = useValidators(
    'name',
    'name',
    badCharsCheck,
    isNotEmptyCheck('name'),
    wordMaxLengthCheck(32, 'Name')
  )
    .add('description', 'description', wordMaxLengthCheck(250, 'Description'))
    .add('payloadSchema', 'payloadSchema', isValidJSONCheck('payloadSchema'))
    .build();

  useEffect(() => {
    if (activeEdit) {
      reset();
      setOpenAddScript(true);
    }
  }, [activeEdit]); // eslint-disable-line react-hooks/exhaustive-deps

  const reset = () => {
    setTestInput(getDefaultTestInput());
    setSelectedScript(defaultScript);
    setOpenAddScript(false);
    setShowScriptEditForm(false);
    validators.clear();
  };

  const openEditorOnAdd = (script) => {
    script.testInputs = testInput;
    setOpenAddScript(false);
    setSelectedScript(script);
    setShowScriptEditForm(true);
    validators.clear();
  };

  const saveScript = (script) => {
    setSelectedScript(script);
    dispatch(UpdateScript(script, false));
  };

  const testInputUpdate = (value: string) => {
    validators.remove('payloadSchema');
    const validations = {
      payloadSchema: value,
    };
    if (value.length > 0) {
      validators.checkAll(validations);
    }
    setTestInput(value);
  };

  const onEdit = (script) => {
    script.testInputs = testInput;
    setSelectedScript(script);
    setShowScriptEditForm(true);
  };

  const onNameChange = (value) => {
    validators.remove('name');
    const validations = {
      name: value,
    };
    validators.checkAll(validations);
    setName(value);
  };
  const onDescriptionChange = (value) => {
    validators.remove('description');
    validators['description'].check(value);
    setDescription(value);
  };
  const onScriptChange = (value) => {
    setScript(value);
  };

  useEffect(() => {
    showScriptEditForm ? (document.body.style.overflow = 'hidden') : (document.body.style.overflow = 'unset');
  }, [showScriptEditForm]);
  return (
    <>
      <div>
        <GoAButton
          testId="add-script-btn"
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
      <AddScriptModal
        open={openAddScript}
        isNew={true}
        initialValue={selectedScript}
        onCancel={() => {
          reset();
        }}
        openEditorOnAdd={openEditorOnAdd}
        onSave={saveScript}
      />

      {showScriptEditForm && (
        <Modal open={showScriptEditForm} isNotificationActive={isNotificationActive} data-testid="script-edit-form">
          {/* Hides body overflow when the modal is up */}
          <BodyGlobalStyles hideOverflow={showScriptEditForm} />
          <ModalContent>
            <OuterNotificationTemplateEditorContainer>
              <TabletMessage goBack={goBack} />

              <HideTablet>
                <ScriptPanelContainer>
                  <ScriptEditor
                    name={name}
                    description={description}
                    scriptStr={script}
                    selectedScript={selectedScript}
                    testInput={testInput}
                    testInputUpdate={testInputUpdate}
                    onNameChange={onNameChange}
                    onDescriptionChange={onDescriptionChange}
                    onScriptChange={onScriptChange}
                    errors={errors}
                    saveAndReset={saveScript}
                    onEditorCancel={reset}
                    onSave={saveScript}
                  />
                </ScriptPanelContainer>
              </HideTablet>
            </OuterNotificationTemplateEditorContainer>
          </ModalContent>
        </Modal>
      )}
    </>
  );
};
