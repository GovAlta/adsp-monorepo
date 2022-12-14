import React, { FunctionComponent, useState, useEffect } from 'react';
import Editor from '@monaco-editor/react';
import { RootState } from '@store/index';
import { Revision } from '@store/configuration/model';
import { useDispatch, useSelector } from 'react-redux';
import { GoAButton, GoAButtonGroup } from '@abgov/react-components-new';
import { GoAModal, GoAModalActions, GoAModalContent, GoAModalTitle } from '@abgov/react-components/experimental';
import { GoAForm, GoAFormItem } from '@abgov/react-components/experimental';
import { replaceConfigurationDataAction } from '@store/configuration/action';
import styled from 'styled-components';

import { useDebounce } from '@lib/useDebounce';
import { jsonSchemaCheck } from '@lib/checkInput';
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
  const dispatch = useDispatch();

  useEffect(() => {
    validateSchema(debouncedRenderConfiguration);
  }, [debouncedRenderConfiguration]);

  const validateSchema = (configuration) => {
    const jsonSchemaValidation = jsonSchemaCheck(definition?.['configurationSchema'], JSON.parse(configuration));
    setError(jsonSchemaValidation ? '' : errorMsg);
  };

  return (
    <ModalOverwrite>
      <GoAModal testId="definition-form" isOpen={open}>
        <GoAModalTitle testId="definition-form-title">{`Edit Revision for ${service}`}</GoAModalTitle>
        <GoAModalContent>
          <GoAForm>
            <GoAFormItem error={error}>
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
                }}
              />
            </GoAFormItem>
          </GoAForm>
        </GoAModalContent>
        <GoAModalActions>
          <GoAButtonGroup alignment="end">
            <GoAButton
              data-testid="form-cancel"
              type="secondary"
              onClick={() => {
                setConfiguration('');
                onClose();
              }}
            >
              Cancel
            </GoAButton>
            <GoAButton
              type="primary"
              data-testid="form-save"
              disabled={error?.length > 0}
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
            </GoAButton>
          </GoAButtonGroup>
        </GoAModalActions>
      </GoAModal>
    </ModalOverwrite>
  );
};

const ModalOverwrite = styled.div`
  .modal {
    max-height: 100% !important;
  }
`;
