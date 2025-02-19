import {
  GoAButton,
  GoAButtonGroup,
  GoADropdown,
  GoADropdownItem,
  GoAFormItem,
  GoATable,
} from '@abgov/react-components';
import { RowLoadMore, RowSkeleton } from '@core-services/app-common';
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
  Resource,
  directoryBusySelector,
  tagResource,
} from '../state';
import { ContentContainer } from '../components/ContentContainer';
import { SearchLayout } from '../components/SearchLayout';
import { DataValueCell } from '../components/DataValueCell';
// import { Digest } from '../components/Digest';
import { ExportModal } from '../components/ExportModal';
import { SearchFormItemsContainer } from '../components/SearchFormItemsContainer';
import { DataValueCriteriaItem } from '../components/DataValueCriteriaItem';
import { AddTagModal } from '../components/AddTagModal';
import { Tags } from './Tags';
import { TagSearchFilter } from './TagSearchFilter';

interface FormSubmissionsProps {
  definitionId: string;
}

export const FormSubmissions: FunctionComponent<FormSubmissionsProps> = ({ definitionId }) => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();

  const [showTagSubmission, setShowTagSubmission] = useState<Pick<Resource, 'name' | 'urn'>>(null);
  const [showExport, setShowExport] = useState(false);

  const directoryBusy = useSelector(directoryBusySelector);
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
  }, [dispatch, definitionId]);

  return (
    <SearchLayout
      searchForm={
        <form>
          <SearchFormItemsContainer>
            <TagSearchFilter
              value={criteria.tag}
              onChange={(value) =>
                dispatch(
                  formActions.setSubmissionCriteria({
                    ...criteria,
                    tag: value,
                  })
                )
              }
            />
            <GoAFormItem label="Disposition" mr="m">
              <GoADropdown
                relative={true}
                name="submission-disposition"
                disabled={!!criteria.tag}
                value={
                  typeof criteria['dispositioned'] !== 'boolean'
                    ? ''
                    : criteria['dispositioned'] === true
                    ? 'dispositioned'
                    : 'not dispositioned'
                }
                onChange={(_, values) =>
                  dispatch(
                    formActions.setSubmissionCriteria({
                      ...criteria,
                      dispositioned: values === '' ? undefined : values === 'dispositioned',
                    })
                  )
                }
              >
                <GoADropdownItem value="" label="<No disposition filter>" />
                <GoADropdownItem value="not dispositioned" label="Not dispositioned" />
                <GoADropdownItem value="dispositioned" label="Dispositioned" />
              </GoADropdown>
            </GoAFormItem>
            {dataValues.map(({ name, path, type }) => (
              <DataValueCriteriaItem
                key={path}
                name={name}
                path={path}
                type={type}
                disabled={!!criteria.tag}
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
              <GoAButton type="tertiary" mr="xl" disabled={!!criteria.tag} onClick={() => setShowExport(true)}>
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
              <th>Disposition</th>
              <th>Tags</th>
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
                <td>{submission.disposition?.status}</td>
                <td>
                  <Tags urn={submission.urn} onTag={() => setShowTagSubmission({ name: '', urn: submission.urn })} />
                </td>
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
            <RowLoadMore
              columns={4 + dataValues.length}
              next={next}
              loading={busy.loading}
              onLoadMore={(after) => dispatch(findSubmissions({ definitionId, criteria, after }))}
            />
          </tbody>
        </GoATable>
      </ContentContainer>
      <AddTagModal
        open={!!showTagSubmission}
        resource={showTagSubmission}
        tagging={directoryBusy.executing}
        onClose={() => setShowTagSubmission(null)}
        onTag={async (urn, label) => {
          await dispatch(tagResource({ urn, label }));
          setShowTagSubmission(null);
        }}
      />
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
