import React, { useEffect, useState } from 'react';
import { Title, EditorLHSWrapper, EditTemplateActions, EditActionLayout } from '../styled-components';
import { useDispatch, useSelector } from 'react-redux';
import MonacoEditor from '@monaco-editor/react';
import { GoAButton, GoAFormItem, GoAButtonGroup } from '@abgov/react-components';
import { jsonSchemaCheck } from '@lib/validation/checkInput';
import { getConfigurationDefinitions } from '@store/configuration/action';
import { getConfigurationActive } from '@store/configuration/action';
import { setPdfDisplayFileId } from '@store/pdf/action';
import { RootState } from '@store/index';

import { useNavigate, useParams } from 'react-router-dom';
import { useDebounce } from '@lib/useDebounce';
import { CustomLoader } from '@components/CustomLoader';
import { ConfigDefinition } from '@store/configuration/model';
import { getConfigurationRevisions } from '@store/configuration/action';
import { replaceConfigurationDataAction } from '@store/configuration/action';

export const ConfigurationData = (): JSX.Element => {
  const dispatch = useDispatch();
  const { id } = useParams<{ id: string }>();
  const [namespace, name] = id.split(':') || [];

  const [dataError, setDataError] = useState('');

  const [configurationData, setConfigurationData] = useState('');
  const [oldConfigurationData, setOldConfigurationData] = useState('');

  const [customIndicator, setCustomIndicator] = useState<boolean>(false);
  const [payloadSchema, setPayloadSchema] = useState<string>(null);
  const { tenantConfigDefinitions, configurationRevisions } = useSelector((state: RootState) => state.configuration);

  const debouncedRenderConfiguration = useDebounce(configurationData, 500);

  const configurationTemplate =
    tenantConfigDefinitions?.configuration && (tenantConfigDefinitions.configuration[id] as ConfigDefinition);

  const invalidJsonMsg = `Please provide a valid json configuration`;
  const errorMsg = `Configuration does not match the definition schema `;

  // eslint-disable-next-line
  const isConfigurationUpdated = (prev: any, next: any): boolean => {
    return JSON.stringify(oldConfigurationData) !== JSON.stringify(configurationData);
  };

  const saveConfigurationTemplate = () => {
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
  };

  useEffect(() => {
    validateSchema(debouncedRenderConfiguration);
  }, [debouncedRenderConfiguration]); // eslint-disable-line react-hooks/exhaustive-deps

  const validateSchema = (configuration) => {
    if (!isInputJson(configuration)) {
      setDataError(invalidJsonMsg);
      return;
    }
    const jsonSchemaValidation = jsonSchemaCheck(JSON.parse(payloadSchema), JSON.parse(configuration));
    setDataError(jsonSchemaValidation ? '' : errorMsg);
  };

  const isInputJson = (input) => {
    try {
      JSON.parse(input);
      return true;
    } catch (error) {
      return false;
    }
  };

  const [tmpTemplate, setTmpTemplate] = useState(JSON.parse(JSON.stringify(configurationTemplate || '')));
  const notifications = useSelector((state: RootState) => state.notifications.notifications);

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
    setConfigurationData(JSON.stringify(configurationRevisions[id]?.revisions?.result[0]?.configuration, null, 2));
    setOldConfigurationData(JSON.stringify(configurationRevisions[id]?.revisions?.result[0]?.configuration, null, 2));
  }, [JSON.stringify(configurationRevisions)]);

  const navigate = useNavigate();

  const cancel = () => {
    dispatch(setPdfDisplayFileId(null));
    navigate('/admin/services/configuration?templates=true');
  };

  const monacoHeight = `calc(100vh - 292px${notifications.length > 0 ? ' - 80px' : ''})`;

  const latestNotification = useSelector(
    (state: RootState) => state.notifications?.notifications[state.notifications?.notifications?.length - 1]
  );
  const Height = latestNotification && !latestNotification.disabled ? 341 : 250;

  return (
    <>
      <div>
        <EditorLHSWrapper>
          <section>
            {customIndicator && <CustomLoader />}
            <Title>Latest Revision Editor</Title>
            <p>
              Edit the latest configuration here using the defined schema. Previous revisions are read-only, but can be
              activated.
            </p>
            <hr />
            <div style={{ marginTop: '20px', height: `calc(100vh - ${Height}px)`, overflowY: 'auto' }}>
              <GoAFormItem label="">
                <GoAFormItem error={dataError} label="">
                  <MonacoEditor
                    height={monacoHeight}
                    language={'json'}
                    options={{
                      automaticLayout: true,
                      scrollBeyondLastLine: false,
                      tabSize: 2,
                      minimap: { enabled: false },
                      folding: true,
                      foldingStrategy: 'auto',
                      showFoldingControls: 'always',
                    }}
                    value={configurationData}
                    data-testid="templateForm-body"
                    onChange={(value) => {
                      setTmpTemplate({ ...tmpTemplate, template: value });
                      setConfigurationData(value);
                    }}
                  />
                </GoAFormItem>
              </GoAFormItem>
            </div>
          </section>
          <EditTemplateActions>
            <hr className="styled-hr styled-hr-bottom" />
            <EditActionLayout>
              <GoAButtonGroup alignment="end">
                <GoAButton
                  disabled={!isConfigurationUpdated(tmpTemplate, configurationTemplate) || dataError.length > 0}
                  onClick={() => {
                    setCustomIndicator(true);
                    saveConfigurationTemplate();
                  }}
                  type="primary"
                  testId="template-form-save"
                >
                  Save
                </GoAButton>
              </GoAButtonGroup>
            </EditActionLayout>
          </EditTemplateActions>
        </EditorLHSWrapper>
      </div>
    </>
  );
};
