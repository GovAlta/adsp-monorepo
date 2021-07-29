import { RootState } from '@store/index';
import { saveApplication } from '@store/status/actions';
import { ServiceStatusApplication } from '@store/status/models';
import React, { useState, useEffect, FormEvent, ChangeEvent } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useHistory, useParams } from 'react-router-dom';
import { GoAButton } from '@abgov/react-components';
import { GoAForm, GoAFormItem, GoAFormButtons } from '@components/Form';

function ApplicationForm(): JSX.Element {
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

  function setValue(e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>, customValue?: unknown) {
    const { name, value } = e.target;
    setApplication({ ...application, [name]: customValue || value });
  }

  function submit(e: FormEvent) {
    console.log(application);
    dispatch(saveApplication(application));
    e.preventDefault();

    history.push('/admin/services/status');
  }

  function cancel() {
    history.push('/admin/services/status');
  }

  return (
    <GoAForm onSubmit={submit}>
      <GoAFormItem>
        <label>Application Name</label>
        <input type="text" name="name" value={application?.name} onChange={setValue} />
      </GoAFormItem>

      <GoAFormItem>
        <label>Description</label>
        <textarea name="description" value={application?.description} onChange={setValue} />
      </GoAFormItem>

      <GoAFormItem>
        <label>Endpoint Url</label>
        <input
          type="text"
          name="endpoint"
          value={application?.endpoint?.url}
          onChange={(e) => setValue(e, { url: e.target.value })}
        />
      </GoAFormItem>

      <GoAFormButtons>
        <GoAButton buttonType="tertiary" onClick={cancel}>
          Cancel
        </GoAButton>
        <GoAButton buttonType="primary" type="submit">
          Save
        </GoAButton>
      </GoAFormButtons>
    </GoAForm>
  );
}

export default ApplicationForm;
