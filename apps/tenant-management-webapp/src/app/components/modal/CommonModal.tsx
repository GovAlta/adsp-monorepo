import React, { ReactNode } from 'react';
import styled from 'styled-components';
import { GoAButton, GoAButtonGroup, GoAFormItem, GoAInput, GoAModal, GoATextArea } from '@abgov/react-components-new';
export interface ContentBody {
  type: string;
  label?: string;
  error?: any;
  subType?: string;
  inputType?: string;
  name?: string;
  value?: any;
  onChange?: (name, value) => void;
  render?: () => void;
}
export interface Config {
  open: boolean;
  heading?: string;
  dateTestId?: string;
  saveButtonDisable?: boolean;
  onCancel: () => void;
  onSubmit: () => void;
  body: ContentBody[];
}
interface ModalRepo {
  modalConfig: Config;
  children?: ReactNode;
}
export type UIComponents = 'GoACheckbox' | 'GoAButton' | 'GoAInput' | 'GoATextArea';

export const CommonModal = ({ modalConfig, children }: ModalRepo): JSX.Element => {
  const config = modalConfig;
  const getElement = (element: ContentBody) => {
    switch (element.subType) {
      case 'GoAInput':
        return (
          <GoAInput
            type="text"
            name={element.name}
            width="100%"
            value={element.value}
            data-testid={`${element.name}-text-input`}
            ariaLabel={`${element.name}-text-input`}
            onChange={element.onChange}
          />
        );
      case 'GoATextArea':
        return (
          <GoATextArea
            name={element.name}
            value={element.value}
            data-testid={`${element.name}-textarea`}
            ariaLabel={`${element.name}-textarea`}
            width="100%"
            onChange={element.onChange}
          />
        );
      default:
        return <div>{element.value}</div>;
    }
  };
  return (
    <ModalOverwrite>
      <GoAModal
        data-testId={config.dateTestId}
        heading={config.heading}
        open={config.open}
        actions={
          <GoAButtonGroup alignment="end">
            <GoAButton type="secondary" data-testid="script-modal-cancel" onClick={config.onCancel}>
              Cancel
            </GoAButton>
            <GoAButton
              type="primary"
              data-testid="script-modal-save"
              disabled={config.saveButtonDisable}
              onClick={config.onSubmit}
            >
              Save
            </GoAButton>
          </GoAButtonGroup>
        }
      >
        <ModalContent>
          {config.body.map((element) => {
            if (element.type === 'GoAFormItem') {
              return (
                <GoAFormItem error={element.error} label={element.label}>
                  {getElement(element)}
                </GoAFormItem>
              );
            }
          })}

          <div>{children}</div>
        </ModalContent>
      </GoAModal>
    </ModalOverwrite>
  );
};

const ModalOverwrite = styled.div`
  .modal {
    max-height: 100% !important;
  }
`;
const ModalContent = styled.div`
  padding-left: 3px;
  padding-right: 5px;
`;
