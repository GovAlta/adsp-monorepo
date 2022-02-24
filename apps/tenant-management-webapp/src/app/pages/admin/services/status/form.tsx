import React, { FC, useState } from 'react';
import { useDispatch } from 'react-redux';
import { saveApplication } from '@store/status/actions';
import { ServiceStatusApplication } from '@store/status/models';
import { GoAButton } from '@abgov/react-components';
import {
  GoAForm,
  GoAFormItem,
  GoAInput,
  GoAModal,
  GoAModalActions,
  GoAModalContent,
  GoAModalTitle,
} from '@abgov/react-components/experimental';

interface Props {
  isOpen: boolean;
  title: string;
  defaultApplication: ServiceStatusApplication;
  onCancel?: () => void;
  onSave?: () => void;
}

export const ApplicationFormModal: FC<Props> = ({ isOpen, title, onCancel, onSave, defaultApplication }: Props) => {
  const dispatch = useDispatch();
  const [application, setApplication] = useState<ServiceStatusApplication>({ ...defaultApplication });

  function isFormValid(): boolean {
    if (!application?.name) return false;
    if (!application?.endpoint.url) return false;
    return true;
  }

  function save() {
    if (!isFormValid()) {
      return;
    }
    dispatch(saveApplication(application));
    if (onSave) onSave();
  }

  return (
    <GoAModal isOpen={isOpen}>
      <GoAModalTitle>{title}</GoAModalTitle>
      <GoAModalContent>
        <GoAForm>
          <GoAFormItem>
            <label>Application name</label>
            <GoAInput
              type="text"
              name="name"
              value={application?.name}
              onChange={(name, value) => {
                setApplication({
                  ...application,
                  name: value,
                });
              }}
              aria-label="name"
            />
          </GoAFormItem>

          <GoAFormItem>
            <label>Description</label>
            <textarea
              name="description"
              value={application?.description}
              onChange={(e) =>
                setApplication({
                  ...application,
                  description: e.target.value,
                })
              }
              aria-label="description"
            />
          </GoAFormItem>

          <GoAFormItem>
            <label>Endpoint url</label>
            <GoAInput
              type="text"
              name="endpoint"
              value={application?.endpoint?.url}
              onChange={(name, value) => {
                setApplication({
                  ...application,
                  endpoint: {
                    url: value,
                    status: 'offline',
                  },
                });
              }}
              aria-label="endpoint"
            />
          </GoAFormItem>
        </GoAForm>
      </GoAModalContent>
      <GoAModalActions>
        <GoAButton
          buttonType="tertiary"
          onClick={() => {
            if (onCancel) onCancel();
          }}
        >
          Cancel
        </GoAButton>
        <GoAButton disabled={!isFormValid()} buttonType="primary" onClick={save}>
          Save
        </GoAButton>
      </GoAModalActions>
    </GoAModal>
  );
};

export default ApplicationFormModal;
