import React, { useEffect } from 'react';
import { FunctionComponent, useState } from 'react';
import { TabletMessage } from '@components/TabletMessage';
import { ScriptEditor } from './scriptEditor';
import { useValidators } from '@lib/validation/useValidators';
import { isNotEmptyCheck, isValidJSONCheck, wordMaxLengthCheck, badCharsCheck } from '@lib/validation/checkInput';
import { useDispatch, useSelector } from 'react-redux';
import { ScriptItem, defaultScript } from '@store/script/models';
import {
  BodyGlobalStyles,
  HideTablet,
  Modal,
  ModalContent,
  OuterScriptTemplateEditorContainer,
  ScriptPanelContainer,
} from '../styled-components';
import { RootState } from '@store/index';
import { AddScriptModal } from '../addScriptModal';
import { FETCH_SCRIPTS_ACTION, fetchScripts, UpdateScript } from '@store/script/actions';
import { PageIndicator } from '@components/Indicator';
import { ScriptTableComponent } from '../scriptList';
import { ActionState } from '@store/session/models';
import { renderNoItem } from '@components/NoItem';
import { useLocation, useNavigate } from 'react-router-dom';
import { fetchEventStreams } from '@store/stream/actions';

export const getDefaultTestInput = () => {
  // Oct-27-2022 Paul: we might need to update the default input in the feature.
  return JSON.stringify({ testVariable: 'some data' });
};

interface ScriptEditorWrapperProps {
  openAddScriptModal: boolean;
  updateOpenAddScriptModal?: (val: boolean) => void;
  setActiveEdit: (boolean) => void;
  showScriptTable: boolean;
}
export const ScriptEditorWrapper: FunctionComponent<ScriptEditorWrapperProps> = ({
  showScriptTable,
  openAddScriptModal,
  updateOpenAddScriptModal,
  setActiveEdit,
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [script, setScript] = useState('');
  const [testInput, setTestInput] = useState(JSON.stringify({ testVariable: 'some data' }, null, 2));
  const [selectedScript, setSelectedScript] = useState<ScriptItem>(defaultScript);
  const [openAddScript, setOpenAddScript] = useState(openAddScriptModal);
  const [showScriptEditForm, setShowScriptEditForm] = useState(false);
  const [showScriptListTable, setShowScriptListTable] = useState(showScriptTable);

  const dispatch = useDispatch();
  const location = useLocation();
  const navigate = useNavigate();

  const latestNotification = useSelector(
    (state: RootState) => state.notifications.notifications[state.notifications.notifications.length - 1]
  );
  const { scripts } = useSelector((state: RootState) => state.scriptService);

  const { fetchScriptState } = useSelector((state: RootState) => ({
    fetchScriptState: state.scriptService.indicator?.details[FETCH_SCRIPTS_ACTION] || '',
  }));
  const isNotificationActive = latestNotification && !latestNotification.disabled;

  useEffect(() => {
    dispatch(fetchScripts());
    dispatch(fetchEventStreams());
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    setOpenAddScript(openAddScriptModal);
    return () => {
      setOpenAddScript(false);
    };
  }, [openAddScriptModal]);

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

  const reset = () => {
    setTestInput(getDefaultTestInput());
    setSelectedScript(defaultScript);
    setActiveEdit(false);

    if (updateOpenAddScriptModal) {
      updateOpenAddScriptModal(false);
    }

    setShowScriptEditForm(false);
    validators.clear();
    document.body.style.overflow = 'unset';
    navigate({
      pathname: `/admin/services/script`,
      search: '?scripts=true',
    });
  };

  const openEditorOnAdd = (script) => {
    script.testInputs = testInput;
    setOpenAddScript(false);
    setSelectedScript(script);
    setShowScriptEditForm(true);
    validators.clear();
  };

  const goBack = () => {
    setShowScriptEditForm(false);
    if (setActiveEdit) {
      setActiveEdit(false);
    }
    setOpenAddScript(false);
  };

  const onEdit = (script) => {
    script.testInputs = testInput;
    setOpenAddScript(false);
    if (setActiveEdit) {
      setActiveEdit(false);
    }
    if (location.pathname.includes(script.id)) {
      setSelectedScript(scripts[script.id]);
    }
    setShowScriptEditForm(true);
  };

  const saveScript = (script) => {
    setSelectedScript(script);
    dispatch(UpdateScript(script, false));
  };

  return (
    <section>
      <div>
        {openAddScript ? (
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
        ) : null}

        {showScriptListTable && fetchScriptState === ActionState.inProcess && <PageIndicator />}
        {showScriptListTable && fetchScriptState === ActionState.completed && !scripts && renderNoItem('script')}
        {showScriptListTable && fetchScriptState === ActionState.completed && scripts && (
          <div>
            <ScriptTableComponent scripts={scripts} onEdit={onEdit} />
          </div>
        )}

        {showScriptEditForm && (
          <Modal open={showScriptEditForm} isNotificationActive={isNotificationActive} data-testid="script-edit-form">
            <BodyGlobalStyles hideOverflow={showScriptEditForm} />
            <ModalContent>
              <OuterScriptTemplateEditorContainer>
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
              </OuterScriptTemplateEditorContainer>
            </ModalContent>
          </Modal>
        )}
      </div>
    </section>
  );
};
