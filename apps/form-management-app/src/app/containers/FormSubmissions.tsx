import React, { FunctionComponent, useEffect, useState } from 'react';
import {
  GoAButton,
  GoAButtonGroup,
  GoADropdown,
  GoADropdownItem,
  GoAFormItem,
  GoATable,
  GoACallout,
  GoASkeleton,
} from '@abgov/react-components';
import { useDispatch, useSelector } from 'react-redux';
import { ContentWrapper, FormSection, LoadingSkeletonWrapper } from '../components';
import { useNavigate } from 'react-router-dom';
import {
  getFormSubmissions,
  submissionsSelector,
  submissionCriteriaSelector,
  formActions,
  formLoadingSelector,
  selectSubmission,
} from '../state/form/form.slice';
import { AppDispatch } from '../state/store';

interface RowLoadMoreProps {
  next?: string;
  columns: number;
  loading: boolean;
  onLoadMore: (after: string) => void;
}
const RowLoadMore: React.FC<RowLoadMoreProps> = ({ next, columns, loading, onLoadMore }) => {
  if (!next) return null;
  return (
    <tr>
      <td colSpan={columns} style={{ textAlign: 'center', padding: '16px' }}>
        <GoAButton type="tertiary" disabled={loading} onClick={() => onLoadMore(next)}>
          Load more
        </GoAButton>
      </td>
    </tr>
  );
};

interface FormSubmissionsProps {
  definitionId: string;
}

export const FormSubmissions: FunctionComponent<FormSubmissionsProps> = ({ definitionId }) => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();

  const { submissions: loading } = useSelector(formLoadingSelector);
  const submissions = useSelector(submissionsSelector);
  const criteria = useSelector(submissionCriteriaSelector);

  useEffect(() => {
    if (submissions.length < 1) {
      dispatch(getFormSubmissions({ definitionId, criteria }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch, definitionId]);

  return (
    <ContentWrapper>
      <h2>Form Submissions</h2>

      <FormSection>
        <GoAFormItem label="Disposition Status">
          <GoADropdown
            relative={true}
            name="submission-disposition"
            value={criteria.dispositionStates?.join(',') || ''}
            onChange={(_, values) =>
              dispatch(
                formActions.setSubmissionCriteria({
                  ...criteria,
                  dispositionStates: values === '' ? [] : [values as string],
                })
              )
            }
          >
            <GoADropdownItem value="" label="All submissions" />
            <GoADropdownItem value="submitted" label="Submitted" />
            <GoADropdownItem value="approved" label="Approved" />
            <GoADropdownItem value="rejected" label="Rejected" />
          </GoADropdown>
        </GoAFormItem>

        <GoAButtonGroup alignment="end" mt="l">
          <GoAButton type="secondary" onClick={() => dispatch(formActions.setSubmissionCriteria({}))}>
            Reset filter
          </GoAButton>
          <GoAButton
            type="primary"
            leadingIcon="search"
            disabled={loading}
            onClick={() => dispatch(getFormSubmissions({ definitionId, criteria }))}
          >
            Find submissions
          </GoAButton>
        </GoAButtonGroup>
      </FormSection>

      {loading && submissions.length === 0 && (
        <LoadingSkeletonWrapper>
          <GoASkeleton type="card" lineCount={3} maxWidth="100%" />
          <GoASkeleton type="card" lineCount={3} maxWidth="100%" />
          <GoASkeleton type="card" lineCount={3} maxWidth="100%" />
          <GoASkeleton type="card" lineCount={3} maxWidth="100%" />
        </LoadingSkeletonWrapper>
      )}

      {submissions && submissions.length > 0 ? (
        <GoATable width="100%">
          <thead>
            <tr>
              <th>Submitted on</th>
              <th>Form ID</th>
              <th>Disposition</th>
              <th>Created By</th>
              <th style={{ textAlign: 'center' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {submissions.map((submission) => (
              <tr key={submission.urn}>
                <td>{submission.created.toFormat('LLL d, yyyy')}</td>
                <td>{submission.formId}</td>
                <td>{submission.disposition?.status || 'No disposition'}</td>
                <td>{submission.createdBy?.name || 'Unknown'}</td>
                <td style={{ textAlign: 'center' }}>
                  <GoAButtonGroup alignment="center">
                    <GoAButton
                      type="secondary"
                      size="compact"
                      onClick={() => {
                        dispatch(selectSubmission(submission.id));
                        navigate(`/admin/form-submission/${submission.id}`);
                      }}
                    >
                      View Details
                    </GoAButton>
                  </GoAButtonGroup>
                </td>
              </tr>
            ))}
          </tbody>
        </GoATable>
      ) : (
        !loading &&
        submissions.length === 0 && (
          <GoACallout type="information" heading="No Submissions Found">
            <p>No submissions have been found for this form definition. Users may not have submitted this form yet.</p>
          </GoACallout>
        )
      )}
    </ContentWrapper>
  );
};
