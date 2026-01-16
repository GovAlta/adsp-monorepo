import React, { useEffect, useState, useMemo } from 'react';
import {
  Title,
  EditorLHSWrapper,
  EditorLabelWrapper,
  EditTemplateActions,
  EditActionLayout,
} from '../styled-components';
import { useDispatch, useSelector } from 'react-redux';
import MonacoEditor from '@monaco-editor/react';
import { useValidators } from '@lib/validation/useValidators';
import { updateConfigurationDefinition } from '@store/configuration/action';
import { isValidJSONCheck } from '@lib/validation/checkInput';
import { getConfigurationDefinitions } from '@store/configuration/action';
import { RevisionTable } from '../revisions/revisionsTable';
import { GoabButton, GoabFormItem, GoabButtonGroup } from '@abgov/react-components';
import { Tab, Tabs } from '@components/Tabs';
import { SaveFormModal } from '@components/saveModal';
import { getConfigurationActive } from '@store/configuration/action';
import { setPdfDisplayFileId } from '@store/pdf/action';
import { RootState } from '@store/index';

import { useNavigate, useParams } from 'react-router-dom';

import { ConfigForm } from './ConfigForm';
import { ConfigDefinition } from '@store/configuration/model';
import { getConfigurationRevisions, closeTemplate } from '@store/configuration/action';
import { PageIndicator } from '@components/Indicator';

export const ConfigurationEditor = (): JSX.Element => {
  const dispatch = useDispatch();
  const { id } = useParams<{ id: string }>();
  const [namespace, name] = id.split(':') || [];
  const [saveModal, setSaveModal] = useState({ visible: false, closeEditor: false });
  const [payloadSchema, setPayloadSchema] = useState<string>(null);
  const { tenantConfigDefinitions, configurationRevisions } = useSelector((state: RootState) => state.configuration);

  // eslint-disable-next-line
  const isConfigurationUpdated = (prev: any, next: any): boolean => {
    return JSON.stringify(prev?.configurationSchema) !== JSON.stringify(next?.configurationSchema);
  };
  const indicator = useSelector((state: RootState) => state?.session?.indicator);

  const configurationTemplate = useMemo(() => {
    const base = tenantConfigDefinitions?.configuration?.[id] as ConfigDefinition | undefined;
    return base && { ...base, namespace, name };
  }, [tenantConfigDefinitions?.configuration, id, namespace, name]);

  const [tmpTemplate, setTmpTemplate] = useState(JSON.parse(JSON.stringify(configurationTemplate || '')));

  const elementIndicator = useSelector((state: RootState) => {
    return state?.session?.elementIndicator;
  });

  const notifications = useSelector((state: RootState) => state.notifications.notifications);
  const [EditorError, setEditorError] = useState<Record<string, string>>({
    testData: null,
  });

  useEffect(() => {
    if (!tenantConfigDefinitions) {
      dispatch(getConfigurationDefinitions());
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    setTmpTemplate(JSON.parse(JSON.stringify(configurationTemplate || '')));
    setPayloadSchema(JSON.stringify(configurationTemplate?.configurationSchema, null, 2));
    dispatch(getConfigurationActive(id));
    dispatch(getConfigurationRevisions(id));
    //eslint-disable-next-line
  }, [configurationTemplate]);

  useEffect(() => {
    if (saveModal.closeEditor) {
      cancel();
    }
  }, [saveModal]); // eslint-disable-line react-hooks/exhaustive-deps

  const saveConfigurationTemplate = (value, options = null) => {
    const saveObject = JSON.parse(JSON.stringify(value));
    dispatch(updateConfigurationDefinition(saveObject, false));
  };

  const navigate = useNavigate();

  const cancel = () => {
    dispatch(setPdfDisplayFileId(null));
    navigate('/admin/services/configuration?templates=true');
  };

  const { errors, validators } = useValidators('payloadSchema', 'payloadSchema')
    .add('payloadSchema', 'payloadSchema', isValidJSONCheck('payloadSchema'))
    .build();

  const monacoHeight = `calc(100vh - 416px${notifications.length > 0 ? ' - 80px' : ''})`;

  const backButtonDisabled = () => {
    if (!elementIndicator) return false;

    if (elementIndicator?.show) return true;

    return false;
  };
  const latestNotification = useSelector(
    (state: RootState) => state.notifications?.notifications[state.notifications?.notifications?.length - 1]
  );
  const Height = latestNotification && !latestNotification.disabled ? 401 : 310;

  return (
    <>
      <div>
        <EditorLHSWrapper>
          <section>
            {indicator.show && <PageIndicator />}
            <Title>Configuration Editor</Title>
            <hr />

            {configurationTemplate && <ConfigForm template={configurationTemplate} id={id} />}
            <div style={{ height: `calc(100vh - ${Height}px)`, overflowY: 'auto' }}>
              <GoabFormItem label="">
                <Tabs activeIndex={0}>
                  <Tab testId={`pdf-edit-header`} label={<EditorLabelWrapper>Configuration schema</EditorLabelWrapper>}>
                    <div style={{ marginTop: '20px' }}>
                      <GoabFormItem error={errors?.['payloadSchema']}>
                        <MonacoEditor
                          data-testid="form-schema"
                          height={monacoHeight}
                          value={payloadSchema}
                          onChange={(value) => {
                            validators.remove('payloadSchema');

                            const validations = {
                              payloadSchema: value,
                            };

                            if (!validators.checkAll(validations)) {
                              return;
                            }

                            setPayloadSchema(value);
                            setTmpTemplate({ ...tmpTemplate, configurationSchema: JSON.parse(value) });
                          }}
                          language="json"
                          options={{
                            automaticLayout: true,
                            scrollBeyondLastLine: false,
                            tabSize: 2,
                            minimap: { enabled: false },
                            folding: true,
                            foldingStrategy: 'auto',
                            showFoldingControls: 'always',
                          }}
                        />
                      </GoabFormItem>
                    </div>
                  </Tab>
                  <Tab testId={`pdf-edit-footer`} label={<EditorLabelWrapper>Managing revisions</EditorLabelWrapper>}>
                    <GoabFormItem error={errors?.footer ?? ''} label="">
                      <RevisionTable service={id} />
                    </GoabFormItem>
                  </Tab>
                </Tabs>
              </GoabFormItem>
            </div>
          </section>
          <EditTemplateActions>
            <hr className="styled-hr styled-hr-bottom" />
            <EditActionLayout>
              <GoabButtonGroup alignment="start">
                <GoabButton
                  disabled={
                    !isConfigurationUpdated(tmpTemplate, configurationTemplate) ||
                    EditorError?.testData !== null ||
                    errors?.['payloadSchema']?.length > 0
                  }
                  onClick={() => {
                    saveConfigurationTemplate(tmpTemplate);
                  }}
                  type="primary"
                  testId="template-form-save"
                >
                  Save
                </GoabButton>
                <GoabButton
                  onClick={() => {
                    if (isConfigurationUpdated(tmpTemplate, configurationTemplate)) {
                      setSaveModal({ visible: true, closeEditor: false });
                    } else {
                      cancel();
                    }
                    dispatch(closeTemplate());
                  }}
                  testId="template-form-close"
                  type="secondary"
                  disabled={backButtonDisabled()}
                >
                  Back
                </GoabButton>
              </GoabButtonGroup>
            </EditActionLayout>
          </EditTemplateActions>
        </EditorLHSWrapper>
      </div>

      <SaveFormModal
        open={saveModal.visible}
        onDontSave={() => {
          setSaveModal({ visible: false, closeEditor: true });
        }}
        onSave={() => {
          saveConfigurationTemplate(tmpTemplate, 'no-refresh');
          setSaveModal({ visible: false, closeEditor: true });
        }}
        saveDisable={!isConfigurationUpdated(tmpTemplate, configurationTemplate) || EditorError?.testData !== null}
        onCancel={() => {
          setSaveModal({ visible: false, closeEditor: false });
        }}
      />
    </>
  );
};
