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
  GoATextArea,
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

    dispatch(saveApplication(application));
    history.push('/admin/services/status');
  }

  function cancel() {
    history.push('/admin/services/status');
  }

  return (
    <GoAModal isOpen={true}>
      <GoAModalTitle>New Application</GoAModalTitle>
      <GoAModalContent>
        <GoAForm>
          <GoAFormItem>
            <label>Application Name</label>
            <GoAInput type="text" name="name" value={application?.name} onChange={setValue} />
          </GoAFormItem>

          <GoAFormItem>
            <label>Description</label>
            <GoATextArea name="description" value={application?.description} onChange={setValue} />
          </GoAFormItem>

          <GoAFormItem>
            <label>Endpoint Url</label>
            <GoAInput type="text" name="endpoint" value={application?.endpoint?.url} onChange={setValue} />
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
