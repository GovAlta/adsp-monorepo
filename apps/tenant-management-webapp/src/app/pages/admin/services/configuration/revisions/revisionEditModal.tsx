import React, { FunctionComponent, useState, useEffect } from 'react';
import Editor from '@monaco-editor/react';
import { RootState } from '@store/index';
import { Revision } from '@store/configuration/model';
import { useDispatch, useSelector } from 'react-redux';
import { GoabButton, GoabButtonGroup, GoabFormItem, GoabModal } from '@abgov/react-components';
import { replaceConfigurationDataAction } from '@store/configuration/action';
import styled from 'styled-components';

import { useDebounce } from '@lib/useDebounce';
import { jsonSchemaCheck } from '@lib/validation/checkInput';
interface RevisionEditProps {
  open: boolean;
  revision?: Revision;
  service?: string;
  onClose?: () => void;
}

export const RevisionEditModal: FunctionComponent<RevisionEditProps> = ({ open, revision, service, onClose }) => {
  const [configuration, setConfiguration] = useState<string>(JSON.stringify(revision?.configuration, null, 2));
  const debouncedRenderConfiguration = useDebounce(configuration, 500);

  const [error, setError] = useState('');
  const definition = useSelector(
    (state: RootState) => state.configuration.tenantConfigDefinitions.configuration[service]
  );

  const errorMsg = `Configuration ${service} does not match the definition schema `;
  const invalidJsonMsg = `Please provide a valid json configuration`;
  const dispatch = useDispatch();

  useEffect(() => {
    revision && validateSchema(debouncedRenderConfiguration);
  }, [debouncedRenderConfiguration]); // eslint-disable-line react-hooks/exhaustive-deps

  const validateSchema = (configuration) => {
    if (!isInputJson(configuration)) {
      setError(invalidJsonMsg);
      return;
    }
    const jsonSchemaValidation = jsonSchemaCheck(definition?.['configurationSchema'], JSON.parse(configuration));
    setError(jsonSchemaValidation ? '' : errorMsg);
  };
  const isInputJson = (input) => {
    try {
      JSON.parse(input);
      return true;
    } catch (error) {
      return false;
    }
  };

  return (
    <ModalOverwrite>
      <GoabModal
        testId="definition-form"
        open={open}
        heading={`Edit Revision for ${service}`}
        actions={
          <GoabButtonGroup alignment="end">
            <GoabButton
              testId="form-cancel"
              type="secondary"
              onClick={() => {
                setConfiguration('');
                onClose();
              }}
            >
              Cancel
            </GoabButton>
            <GoabButton
              type="primary"
              testId="form-save"
              disabled={error?.length > 0 || !configuration}
              onClick={() => {
                const serviceSplit = service.split(':');

                dispatch(
                  replaceConfigurationDataAction(
                    {
                      namespace: serviceSplit[0],
                      name: serviceSplit[1],
                      configuration: JSON.parse(configuration),
                    },
                    false
                  )
                );
                setConfiguration('');
                onClose();
              }}
            >
              Save
            </GoabButton>
          </GoabButtonGroup>
        }
      >
        <GoabFormItem error={error} label="">
          <Editor
            data-testid="form-schema"
            height={200}
            value={configuration}
            onChange={(value) => {
              validateSchema(value);
              setConfiguration(value);
            }}
            language="json"
            options={{
              automaticLayout: true,
              scrollBeyondLastLine: false,
              tabSize: 2,
              minimap: { enabled: false },
              overviewRulerBorder: false,
              lineHeight: 25,
              renderLineHighlight: 'line' as const,
              overviewRulerLanes: 0,
              hideCursorInOverviewRuler: true,
              wordWrap: 'on',
              folding: true,
              foldingStrategy: 'auto',
              showFoldingControls: 'always',
            }}
          />
        </GoabFormItem>
      </GoabModal>
    </ModalOverwrite>
  );
};

const ModalOverwrite = styled.div`
  .modal {
    max-height: 100% !important;
  }
`;
