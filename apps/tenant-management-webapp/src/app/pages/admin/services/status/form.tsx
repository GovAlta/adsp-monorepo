import React, { useState, useEffect, FC } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useHistory, useParams } from 'react-router-dom';
import { RootState } from '@store/index';
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
}

export const ApplicationFormModal: FC<Props> = ({ isOpen }: Props) => {
  const dispatch = useDispatch();
  const serviceStatus = useSelector((state: RootState) => state.serviceStatus);
  const history = useHistory();
  const { applicationId } = useParams<{ applicationId: string }>();

  const [isModalOpen, setIsModalOpen] = useState(true);

  const [application, setApplication] = useState<ServiceStatusApplication>({
    name: '',
    tenantId: '',
    enabled: false,
    description: '',
    endpoint: { url: '', status: 'offline' },
  });

  useEffect(() => {
    if (applicationId) {
      const app = serviceStatus.applications.find((app) => applicationId === app._id);
      setApplication(app);
    }
  }, [applicationId, serviceStatus]);

  function setValue(name: string, value: string) {
    switch (name) {
      case 'name':
      case 'description':
        setApplication({ ...application, [name]: value });
        break;
      case 'endpoint':
        setApplication({ ...application, [name]: { url: value, status: 'offline' } });
        break;
    }
  }

  function isFormValid(): boolean {
    if (!application.name) return false;
    if (!application.endpoint.url) return false;
    return true;
  }

  function save() {
    if (!isFormValid()) {
      return;
    }

    setIsModalOpen(false);
    dispatch(saveApplication(application));
    setTimeout(() => {
      history.push('/admin/services/status');
    }, 0);
  }

  function cancel() {
    setIsModalOpen(false);
    setTimeout(() => {
      history.push('/admin/services/status');
    }, 0);
  }

  return (
    <GoAModal isOpen={isModalOpen}>
      <GoAModalTitle>New application</GoAModalTitle>
      <GoAModalContent>
        <GoAForm>
          <GoAFormItem>
            <label>Application name</label>
            <GoAInput type="text" name="name" value={application?.name} onChange={setValue} aria-label="name" />
          </GoAFormItem>

          <GoAFormItem>
            <label>Description</label>
            <textarea
              name="description"
              value={application?.description}
              onChange={(e) => setValue('description', e.target.value)}
              aria-label="description"
            />
          </GoAFormItem>

          <GoAFormItem>
            <label>Endpoint url</label>
            <GoAInput
              type="text"
              name="endpoint"
              value={application?.endpoint?.url}
              onChange={setValue}
              aria-label="endpoint"
            />
          </GoAFormItem>
        </GoAForm>
      </GoAModalContent>
      <GoAModalActions>
        <GoAButton buttonType="tertiary" onClick={cancel}>
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
