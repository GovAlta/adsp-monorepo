import React, { useEffect, useState, useMemo } from 'react';
import { EditTemplateActions, PdfEditorLabelWrapper, PdfEditActionLayout } from '../../pdf/styled-components';
import { Title, EditorLHSWrapper } from '../styled-components';
import { useDispatch, useSelector } from 'react-redux';
import MonacoEditor from '@monaco-editor/react';
import { useValidators } from '@lib/validation/useValidators';
import { replaceConfigurationDataAction, updateConfigurationDefinition } from '@store/configuration/action';
import { isValidJSONCheck } from '@lib/validation/checkInput';
import { getConfigurationDefinitions } from '@store/configuration/action';
import { RevisionTable } from '../revisions/revisionsTable';
import { GoAButton, GoAFormItem, GoAButtonGroup } from '@abgov/react-components';
import { Tab, Tabs } from '@components/Tabs';
import { SaveFormModal } from '@components/saveModal';
import { getConfigurationActive } from '@store/configuration/action';
import { setPdfDisplayFileId } from '@store/pdf/action';
import { RootState } from '@store/index';

import { useNavigate, useParams } from 'react-router-dom';
import { CustomLoader } from '@components/CustomLoader';
import { ConfigForm } from './ConfigForm';
import { ConfigDefinition } from '@store/configuration/model';
import { getConfigurationRevisions } from '@store/configuration/action';

interface TemplateEditorProps {
  configurationData: string;
  dataError: string;
}

export const ConfigurationEditor = ({ configurationData, dataError }: TemplateEditorProps): JSX.Element => {
  const dispatch = useDispatch();
  const { id } = useParams<{ id: string }>();
  const [namespace, name] = id.split(':');
  const [saveModal, setSaveModal] = useState({ visible: false, closeEditor: false });
  const [originalConfigurationData, setOriginalConfigurationData] = useState(null);
  const [customIndicator, setCustomIndicator] = useState<boolean>(false);
  const [payloadSchema, setPayloadSchema] = useState<string>(null);
  const { tenantConfigDefinitions, configurationRevisions } = useSelector((state: RootState) => state.configuration);

  // eslint-disable-next-line
  const isConfigurationUpdated = (prev: any, next: any): boolean => {
    return (
      JSON.stringify(prev?.configurationSchema) !== JSON.stringify(next?.configurationSchema) ||
      JSON.stringify(originalConfigurationData) !== JSON.stringify(configurationData)
    );
  };

  const configurationTemplate = useMemo(() => {
    const base = tenantConfigDefinitions?.configuration?.[id] as ConfigDefinition | undefined;
    return base && { ...base, namespace, name };
  }, [tenantConfigDefinitions?.configuration, id, namespace, name]);

  const invalidJsonMsg = `Please provide a valid json configuration`;
  const errorMsg = `Configuration qqq does not match the definition schema `;

  const isInputJson = (input) => {
    try {
      JSON.parse(input);
      return true;
    } catch (error) {
      return false;
    }
  };

  const [tmpTemplate, setTmpTemplate] = useState(JSON.parse(JSON.stringify(configurationTemplate || '')));

  const elementIndicator = useSelector((state: RootState) => {
    return state?.session?.elementIndicator;
  });

  const notifications = useSelector((state: RootState) => state.notifications.notifications);
  const [EditorError, setEditorError] = useState<Record<string, string>>({
    testData: null,
  });

  useEffect(() => {
    setCustomIndicator(false);
  }, [tenantConfigDefinitions]);

  useEffect(() => {
    if (
      originalConfigurationData === '' &&
      JSON.stringify(originalConfigurationData) !== JSON.stringify(configurationData)
    ) {
      setOriginalConfigurationData(configurationData);
    }
  }, [configurationData]);

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
  }, [configurationTemplate]);

  useEffect(() => {
    setCustomIndicator(false);
    setOriginalConfigurationData(
      JSON.stringify(configurationRevisions[id]?.revisions?.result[0]?.configuration, null, 2)
    );
  }, [JSON.stringify(configurationRevisions)]);

  useEffect(() => {
    if (saveModal.closeEditor) {
      cancel();
    }
  }, [saveModal]); // eslint-disable-line react-hooks/exhaustive-deps

  const saveConfigurationTemplate = (value, options = null) => {
    const saveObject = JSON.parse(JSON.stringify(value));
    dispatch(updateConfigurationDefinition(saveObject, false));

    if (JSON.stringify(originalConfigurationData) !== JSON.stringify(configurationData)) {
      dispatch(
        replaceConfigurationDataAction(
          {
            namespace: namespace,
            name: name,
            configuration: JSON.parse(configurationData),
          },
          false
        )
      );
    }
  };

  const navigate = useNavigate();

  const cancel = () => {
    dispatch(setPdfDisplayFileId(null));
    navigate('/admin/services/configuration?templates=true');
  };

  const { errors, validators } = useValidators('payloadSchema', 'payloadSchema')
    .add('payloadSchema', 'payloadSchema', isValidJSONCheck('payloadSchema'))
    .build();

  const monacoHeight = `calc(100vh - 376px${notifications.length > 0 ? ' - 80px' : ''})`;

  const backButtonDisabled = () => {
    if (!elementIndicator) return false;

    if (elementIndicator?.show) return true;

    return false;
  };
  const latestNotification = useSelector(
    (state: RootState) => state.notifications?.notifications[state.notifications?.notifications?.length - 1]
  );
  const Height = latestNotification && !latestNotification.disabled ? 391 : 300;

  return (
    <>
      <div style={{ height: '100%' }}>
        <EditorLHSWrapper>
          <section>
            {customIndicator && <CustomLoader />}
            <Title>Configuration Editor</Title>
            <hr />

            {configurationTemplate && <ConfigForm template={configurationTemplate} id={id} />}
            <div style={{ height: `calc(100vh - ${Height}px)`, overflowY: 'auto' }}>
              <GoAFormItem label="">
                <Tabs activeIndex={0}>
                  <Tab
                    testId={`pdf-edit-header`}
                    label={<PdfEditorLabelWrapper>Configuration schema</PdfEditorLabelWrapper>}
                  >
                    <div style={{ marginTop: '20px' }}>
                      <GoAFormItem error={errors?.['payloadSchema']}>
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
                      </GoAFormItem>
                      {/* <pre>{JSON.stringify(configurationTemplate, null, 2)}</pre>
                    <pre>{JSON.stringify(tmpTemplate, null, 2)}</pre> */}
                    </div>
                  </Tab>
                  <Tab
                    testId={`pdf-edit-footer`}
                    label={<PdfEditorLabelWrapper>Managing revisions</PdfEditorLabelWrapper>}
                  >
                    <GoAFormItem error={errors?.footer ?? ''} label="">
                      <RevisionTable service={id} />
                    </GoAFormItem>
                  </Tab>
                </Tabs>
              </GoAFormItem>
            </div>
          </section>
          <EditTemplateActions>
            <hr className="styled-hr styled-hr-bottom" />
            <PdfEditActionLayout>
              <GoAButtonGroup alignment="start">
                {/* <pre>{JSON.stringify(errors?.['payloadSchema'])}</pre>
                <pre>{JSON.stringify(dataError.length > 0)}</pre>
                <pre>x{JSON.stringify(EditorError?.testData !== null)}x</pre>
                <pre>y{JSON.stringify(!isConfigurationUpdated(tmpTemplate, configurationTemplate))}y</pre> */}
                <GoAButton
                  disabled={
                    !isConfigurationUpdated(tmpTemplate, configurationTemplate) ||
                    EditorError?.testData !== null ||
                    errors?.['payloadSchema']?.length > 0 ||
                    dataError.length > 0
                  }
                  onClick={() => {
                    setCustomIndicator(true);
                    saveConfigurationTemplate(tmpTemplate);
                  }}
                  type="primary"
                  testId="template-form-save"
                >
                  Save
                </GoAButton>
                <GoAButton
                  onClick={() => {
                    if (isConfigurationUpdated(tmpTemplate, configurationTemplate)) {
                      setSaveModal({ visible: true, closeEditor: false });
                    } else {
                      cancel();
                    }
                  }}
                  testId="template-form-close"
                  type="secondary"
                  disabled={backButtonDisabled()}
                >
                  Back
                </GoAButton>
              </GoAButtonGroup>
            </PdfEditActionLayout>
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
