import {
  GoAButton,
  GoAButtonGroup,
  GoADropdown,
  GoADropdownItem,
  GoAFormItem,
  GoATable,
} from '@abgov/react-components-new';
import { useDispatch, useSelector } from 'react-redux';
import { FunctionComponent, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AppDispatch,
  findSubmissions,
  submissionsSelector,
  submissionCriteriaSelector,
  formActions,
  busySelector,
  nextSelector,
  selectedDataValuesSelector,
} from '../state';
import { ContentContainer } from '../components/ContentContainer';
import { SearchLayout } from '../components/SearchLayout';
import { DataValueCell } from '../components/DataValueCell';

interface FormSubmissionsProps {
  definitionId: string;
}

export const FormSubmissions: FunctionComponent<FormSubmissionsProps> = ({ definitionId }) => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();

  const busy = useSelector(busySelector);
  const submissions = useSelector(submissionsSelector);
  const columns = useSelector(selectedDataValuesSelector);
  const criteria = useSelector(submissionCriteriaSelector);
  const { submissions: next } = useSelector(nextSelector);

  useEffect(() => {
    dispatch(findSubmissions({ definitionId, criteria }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [definitionId, dispatch]);

  return (
    <SearchLayout
      searchForm={
        <form>
          <GoAFormItem label="Disposition">
            <GoADropdown
              relative={true}
              name="submission-disposition"
              value={
                typeof criteria['dispositioned'] !== 'boolean'
                  ? 'all'
                  : criteria['dispositioned'] === true
                  ? 'dispositioned'
                  : 'not dispositioned'
              }
              onChange={(_, values) =>
                dispatch(
                  formActions.setSubmissionCriteria({
                    ...criteria,
                    dispositioned: values === 'all' ? undefined : values === 'dispositioned',
                  })
                )
              }
            >
              <GoADropdownItem value="not dispositioned" label="Not dispositioned" />
              <GoADropdownItem value="dispositioned" label="Dispositioned" />
              <GoADropdownItem value="all" label="All" />
            </GoADropdown>
          </GoAFormItem>
          <GoAButtonGroup alignment="end">
            <GoAButton
              type="secondary"
              onClick={() => dispatch(formActions.setSubmissionCriteria({ dispositioned: false }))}
            >
              Reset filter
            </GoAButton>
            <GoAButton
              type="primary"
              disabled={busy.loading}
              onClick={() => dispatch(findSubmissions({ definitionId, criteria }))}
            >
              Search submissions
            </GoAButton>
          </GoAButtonGroup>
        </form>
      }
    >
      <ContentContainer>
        <GoATable width="100%">
          <thead>
            <tr>
              <th>Submitted on</th>
              <th>Disposition</th>
              {columns.map(({ name }) => (
                <th>{name}</th>
              ))}
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {submissions.map((submission) => (
              <tr key={submission.urn}>
                <td>{submission.created.toFormat('LLL dd, yyyy')}</td>
                <td>{submission.disposition?.status}</td>
                {columns.map(({ path }) => (
                  <DataValueCell key={path}>{submission.values[path]}</DataValueCell>
                ))}
                <td>
                  <GoAButtonGroup alignment="end">
                    <GoAButton type="secondary" size="compact" onClick={() => navigate(submission.id)}>
                      Open
                    </GoAButton>
                  </GoAButtonGroup>
                </td>
              </tr>
            ))}
            {next && (
              <td colSpan={3 + columns.length}>
                <GoAButtonGroup alignment="center">
                  <GoAButton
                    type="tertiary"
                    disabled={busy.loading}
                    onClick={() => dispatch(findSubmissions({ definitionId, criteria, after: next }))}
                  >
                    Load more
                  </GoAButton>
                </GoAButtonGroup>
              </td>
            )}
          </tbody>
        </GoATable>
      </ContentContainer>
    </SearchLayout>
  );
};
