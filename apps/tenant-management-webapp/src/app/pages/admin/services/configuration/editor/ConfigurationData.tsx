import React, { useEffect, useState } from 'react';
import { EditorLHSWrapper } from '../../pdf/styled-components';
import { Title } from '../styled-components';
import { useDispatch, useSelector } from 'react-redux';
import MonacoEditor from '@monaco-editor/react';

import { jsonSchemaCheck } from '@lib/validation/checkInput';
import { getConfigurationDefinitions } from '@store/configuration/action';
import { GoAFormItem } from '@abgov/react-components';
import { getConfigurationActive } from '@store/configuration/action';
import { setPdfDisplayFileId } from '@store/pdf/action';
import { RootState } from '@store/index';

import { useNavigate, useParams } from 'react-router-dom';
import { useDebounce } from '@lib/useDebounce';
import { CustomLoader } from '@components/CustomLoader';
import { ConfigDefinition } from '@store/configuration/model';
import { getConfigurationRevisions } from '@store/configuration/action';

interface TemplateEditorProps {
  //eslint-disable-next-line
  setDataError?: (error: string) => void;
  dataError?: string;
  configurationData: string;
  setConfigurationData: (data: string) => void;
}

export const ConfigurationData = ({
  dataError,
  setDataError,
  configurationData,
  setConfigurationData,
}: TemplateEditorProps): JSX.Element => {
  const dispatch = useDispatch();
  const { id } = useParams<{ id: string }>();

  const [customIndicator, setCustomIndicator] = useState<boolean>(false);
  const [payloadSchema, setPayloadSchema] = useState<string>(null);
  const { tenantConfigDefinitions, configurationRevisions } = useSelector((state: RootState) => state.configuration);

  const debouncedRenderConfiguration = useDebounce(configurationData, 500);

  const configurationTemplate =
    tenantConfigDefinitions?.configuration && (tenantConfigDefinitions.configuration[id] as ConfigDefinition);

  const invalidJsonMsg = `Please provide a valid json configuration`;
  const errorMsg = `Configuration qqq does not match the definition schema `;

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
  }, [JSON.stringify(configurationRevisions)]);

  const navigate = useNavigate();

  const cancel = () => {
    dispatch(setPdfDisplayFileId(null));
    navigate('/admin/services/configuration?templates=true');
  };

  const monacoHeight = `calc(100vh - 156px${notifications.length > 0 ? ' - 80px' : ''})`;

  const latestNotification = useSelector(
    (state: RootState) => state.notifications?.notifications[state.notifications?.notifications?.length - 1]
  );
  const Height = latestNotification && !latestNotification.disabled ? 191 : 100;

  return (
    <>
      <div style={{ height: '100%' }}>
        <EditorLHSWrapper>
          <section>
            {customIndicator && <CustomLoader />}
            <Title>Configuration Data</Title>
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
        </EditorLHSWrapper>
      </div>
    </>
  );
};
