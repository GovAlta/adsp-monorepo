import {
  GoabButton,
  GoabButtonGroup,
  GoabDropdown,
  GoabDropdownItem,
  GoabFormItem,
  GoabTable,
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
import { GoabDropdownOnChangeDetail } from '@abgov/ui-components-common';
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
            <GoabFormItem label="Disposition" mr="m">
              <GoabDropdown
                name="submission-disposition"
                disabled={!!criteria.tag}
                value={
                  typeof criteria['dispositioned'] !== 'boolean'
                    ? ''
                    : criteria['dispositioned'] === true
                    ? 'dispositioned'
                    : 'not dispositioned'
                }
                onChange={(detail: GoabDropdownOnChangeDetail) =>
                  dispatch(
                    formActions.setSubmissionCriteria({
                      ...criteria,
                      dispositioned: detail.value === '' ? undefined : detail.value === 'dispositioned',
                    })
                  )
                }
              >
                <GoabDropdownItem value="" label="<No disposition filter>" />
                <GoabDropdownItem value="not dispositioned" label="Not dispositioned" />
                <GoabDropdownItem value="dispositioned" label="Dispositioned" />
              </GoabDropdown>
            </GoabFormItem>
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
          <GoabButtonGroup alignment="end" mt="l">
            {canExport && (
              <GoabButton type="tertiary" mr="xl" disabled={!!criteria.tag} onClick={() => setShowExport(true)}>
                Export to file
              </GoabButton>
            )}
            <GoabButton
              type="secondary"
              onClick={() => dispatch(formActions.setSubmissionCriteria({ dispositioned: false }))}
            >
              Reset filter
            </GoabButton>
            <GoabButton
              type="primary"
              leadingIcon="search"
              disabled={busy.loading}
              onClick={() => dispatch(findSubmissions({ definitionId, criteria }))}
            >
              Find submissions
            </GoabButton>
          </GoabButtonGroup>
        </form>
      }
    >
      <ContentContainer>
        <GoabTable width="100%">
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
                  <GoabButtonGroup alignment="end">
                    <GoabButton type="secondary" size="compact" onClick={() => navigate(submission.id)}>
                      Open
                    </GoabButton>
                  </GoabButtonGroup>
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
        </GoabTable>
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
