import { RootState } from '@store/index';
import { saveApplication } from '@store/status/actions';
import { ServiceStatusApplication, ServiceStatusEndpoint, ServiceStatusType } from '@store/status/models';
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
    timeIntervalMin: 10,
    endpoints: [],
  });

  useEffect(() => {
    if (applicationId) {
      const app = serviceStatus.applications.find((app) => applicationId === app.id);
      setApplication(app);
    }
  }, [applicationId, serviceStatus]);

  function setValue(e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>, customValue?: unknown) {
    const { name, value } = e.target;
    setApplication({ ...application, [name]: customValue || value.trim() });
  }

  function submit(e: FormEvent) {
    const form = new FormData(e.target as HTMLFormElement);
    const applicationName = form.get('name') as string;
    const urls = form.get('endpoints') as string;
    const interval = form.get('timeIntervalMin') as string;

    const getStatus = (url: string): ServiceStatusType =>
      application.endpoints.find((endpoint) => endpoint.url === url)?.status ?? 'unknown';

    const params = {
      ...application,
      name: applicationName,
      timeIntervalMin: parseInt(interval),
      endpoints: urls.split('\r\n').map((url) => ({ url, status: getStatus(url) } as ServiceStatusEndpoint)),
    };

    dispatch(saveApplication(params));
    e.preventDefault();

    history.push('/admin/tenant-admin/services/service-status');
  }

  function cancel() {
    history.push('/admin/tenant-admin/services/service-status');
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
        <label>Endpoint Urls</label>
        <textarea
          name="endpoints"
          rows={4}
          value={application?.endpoints?.map((endpoint) => endpoint.url).join('\r\n')}
          onChange={(e) =>
            setValue(
              e,
              e.target.value.split('\r\n').map((url) => ({ url, status: 'unknown' }))
            )
          }
        />
      </GoAFormItem>

      <GoAFormItem>
        <label>Test Interval (minutes)</label>
        <input
          type="number"
          name="timeIntervalMin"
          value={application?.timeIntervalMin}
          onChange={(e) => setValue(e)}
        />
      </GoAFormItem>

      <GoAFormButtons>
        <GoAButton buttonType="tertiary" onClick={cancel}>
          Cancel
        </GoAButton>
        <GoAButton buttonType="primary" type="submit">
          Save Application
        </GoAButton>
      </GoAFormButtons>
    </GoAForm>
  );
}

export default ApplicationForm;
