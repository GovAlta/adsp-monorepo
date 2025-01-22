import {
  GoAButton,
  GoAButtonGroup,
  GoADropdown,
  GoADropdownItem,
  GoAFormItem,
  GoATable,
} from '@abgov/react-components-new';
import { useDispatch, useSelector } from 'react-redux';
import { FunctionComponent, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AppDispatch,
  findSubmissions,
  submissionsSelector,
  submissionCriteriaSelector,
  formActions,
  formBusySelector,
  nextSelector,
  selectedDataValuesSelector,
  canExportSelector,
  exportSubmissions,
  submissionsExportSelector,
} from '../state';
import { ContentContainer } from '../components/ContentContainer';
import { SearchLayout } from '../components/SearchLayout';
import { DataValueCell } from '../components/DataValueCell';
import { Digest } from '../components/Digest';
import { ExportModal } from '../components/ExportModal';
import { SearchFormItemsContainer } from '../components/SearchFormItemsContainer';
import { DataValueCriteriaItem } from '../components/DataValueCriteriaItem';
import { RowSkeleton } from '../components/RowSkeleton';

interface FormSubmissionsProps {
  definitionId: string;
}

export const FormSubmissions: FunctionComponent<FormSubmissionsProps> = ({ definitionId }) => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();

  const [showExport, setShowExport] = useState(false);

  const canExport = useSelector(canExportSelector);
  const busy = useSelector(formBusySelector);
  const submissions = useSelector(submissionsSelector);
  const dataValues = useSelector(selectedDataValuesSelector);
  const criteria = useSelector(submissionCriteriaSelector);
  const { submissions: next } = useSelector(nextSelector);
  const submissionsExport = useSelector(submissionsExportSelector);

  useEffect(() => {
    if (submissions.length < 1) {
      dispatch(findSubmissions({ definitionId, criteria }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [definitionId, dispatch]);

  return (
    <SearchLayout
      searchForm={
        <form>
          <SearchFormItemsContainer>
            <GoAFormItem label="Disposition" mr="m">
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
            {dataValues.map(({ name, path, type }) => (
              <DataValueCriteriaItem
                key={path}
                name={name}
                path={path}
                type={type}
                value={criteria?.dataCriteria?.[path]?.toString() || ''}
                onChange={(value) =>
                  dispatch(
                    formActions.setSubmissionCriteria({
                      ...criteria,
                      dataCriteria: {
                        ...criteria?.dataCriteria,
                        [path]: value || undefined,
                      },
                    })
                  )
                }
              />
            ))}
          </SearchFormItemsContainer>
          <GoAButtonGroup alignment="end" mt="l">
            {canExport && (
              <GoAButton type="tertiary" mr="xl" onClick={() => setShowExport(true)}>
                Export to file
              </GoAButton>
            )}
            <GoAButton
              type="secondary"
              onClick={() => dispatch(formActions.setSubmissionCriteria({ dispositioned: false }))}
            >
              Reset filter
            </GoAButton>
            <GoAButton
              type="primary"
              leadingIcon="search"
              disabled={busy.loading}
              onClick={() => dispatch(findSubmissions({ definitionId, criteria }))}
            >
              Find submissions
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
              <th>Digest</th>
              <th>Disposition</th>
              {dataValues.map(({ name, path }) => (
                <th key={path}>{name}</th>
              ))}
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {submissions.map((submission) => (
              <tr key={submission.urn}>
                <td>{submission.created.toFormat('LLL d, yyyy')}</td>
                <td>
                  <Digest value={submission.hash} />
                </td>
                <td>{submission.disposition?.status}</td>
                {dataValues.map(({ path }) => (
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
            <RowSkeleton columns={4 + dataValues.length} show={busy.loading} />
            {next && (
              <tr>
                <td colSpan={4 + dataValues.length}>
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
              </tr>
            )}
          </tbody>
        </GoATable>
      </ContentContainer>
      <ExportModal
        open={showExport}
        heading="Export submissions to file"
        state={submissionsExport}
        onClose={() => setShowExport(false)}
        onStartExport={(format) => dispatch(exportSubmissions({ definitionId, criteria, format }))}
      />
    </SearchLayout>
  );
};
