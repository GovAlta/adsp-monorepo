import { GoAButton, GoAFormItem } from '@abgov/react-components';
import { useDispatch, useSelector } from 'react-redux';
import { FunctionComponent, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { DateTime } from 'luxon';
import {
  selectSubmission,
  selectedSubmissionSelector,
  formLoadingSelector,
  selectedDefinitionSelector,
} from '../state/form/form.slice';
import { AppDispatch } from '../state/store';

export const FormSubmission: FunctionComponent = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();

  const { submissionId } = useParams();
  const { submissions: loading } = useSelector(formLoadingSelector);
  const definition = useSelector(selectedDefinitionSelector);
  const submission = useSelector(selectedSubmissionSelector);

  const [formSubmissionUrn, setFormSubmissionUrn] = useState<string | null>(null);

  useEffect(() => {
    if (submissionId) {
      dispatch(selectSubmission(submissionId));
    }
  }, [dispatch, submissionId]);

  useEffect(() => {
    if (submission) {
      const urn = `urn:ads:platform:form-service:v1:/forms/${submission.formId}${
        submission.id ? `/submissions/${submission.id}` : ''
      }`;
      setFormSubmissionUrn(urn);
    }
  }, [submission]);

  if (!submission) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <div>
        <GoAButton type="tertiary" onClick={() => navigate('../')}>
          Back to submissions
        </GoAButton>
      </div>

      <div style={{ padding: '1rem' }}>
        <h1>Form Submission Details</h1>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '1rem',
            marginBottom: '2rem',
          }}
        >
          <GoAFormItem label="Submitted by">{submission.createdBy.name}</GoAFormItem>
          <GoAFormItem label="Submitted on">{DateTime.fromISO(submission.created).toFormat('LLL d, yyyy')}</GoAFormItem>
          <GoAFormItem label="Form ID">{submission.formId}</GoAFormItem>
          <GoAFormItem label="Definition ID">{submission.formDefinitionId}</GoAFormItem>
        </div>

        {submission.disposition && (
          <div style={{ marginBottom: '2rem' }}>
            <h3>Disposition</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
              <GoAFormItem label="Status">{submission.disposition.status}</GoAFormItem>
              <GoAFormItem label="Reason">{submission.disposition.reason}</GoAFormItem>
              <GoAFormItem label="Date">
                {DateTime.fromISO(submission.disposition.date).toFormat('LLL d, yyyy')}
              </GoAFormItem>
            </div>
          </div>
        )}

        <div>
          <h3>Form Data</h3>
          <pre
            style={{
              background: '#f5f5f5',
              padding: '1rem',
              borderRadius: '4px',
              overflow: 'auto',
              fontSize: '0.875rem',
            }}
          >
            {JSON.stringify(submission.formData, null, 2)}
          </pre>
        </div>

        {submission.formFiles && Object.keys(submission.formFiles).length > 0 && (
          <div style={{ marginTop: '2rem' }}>
            <h3>Files</h3>
            <ul>
              {Object.entries(submission.formFiles).map(([key, urn]) => (
                <li key={key}>
                  {key}: {urn}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};
