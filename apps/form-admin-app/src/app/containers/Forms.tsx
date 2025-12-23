import {
  GoabButton,
  GoabButtonGroup,
  GoabDropdown,
  GoabDropdownItem,
  GoabFormItem,
  GoabIcon,
  GoabTable,
} from '@abgov/react-components';
import { RowLoadMore, RowSkeleton } from '@core-services/app-common';
import { FunctionComponent, useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { NavigateFunction, useNavigate } from 'react-router-dom';
import {
  AppDispatch,
  formBusySelector,
  selectedDataValuesSelector,
  findForms,
  formActions,
  formCriteriaSelector,
  formsSelector,
  nextSelector,
  canExportSelector,
  exportForms,
  formsExportSelector,
  loadTopic,
  definitionSelector,
  topicSelector,
  AppState,
  connectStream,
  Resource,
  directoryBusySelector,
  tagResource,
} from '../state';
import { SearchLayout } from '../components/SearchLayout';
import { ContentContainer } from '../components/ContentContainer';
import { DataValueCell } from '../components/DataValueCell';
import { ExportModal } from '../components/ExportModal';
import { SearchFormItemsContainer } from '../components/SearchFormItemsContainer';
import { DataValueCriteriaItem } from '../components/DataValueCriteriaItem';
import { AddTagModal } from '../components/AddTagModal';
import { Tags } from './Tags';
import { TagSearchFilter } from './TagSearchFilter';
import { GoabDropdownOnChangeDetail } from '@abgov/ui-components-common';
interface FormRowProps {
  dispatch: AppDispatch;
  navigate: NavigateFunction;
  hasSupportTopic: boolean;
  form: ReturnType<typeof formsSelector>[0];
  dataValues: ReturnType<typeof selectedDataValuesSelector>;
  onTag: () => void;
}

const FormRow: FunctionComponent<FormRowProps> = ({ dispatch, navigate, hasSupportTopic, form, dataValues, onTag }) => {
  const topic = useSelector((state: AppState) => topicSelector(state, form.urn));

  useEffect(() => {
    if (hasSupportTopic && topic === undefined) {
      dispatch(loadTopic({ resourceId: form.urn, typeId: 'form-questions' }));
    }
  }, [dispatch, hasSupportTopic, form, topic]);

  return (
    <tr key={form.urn}>
      <td>{topic?.requiresAttention && <GoabIcon type="mail-unread" size="small" ariaLabel="mail-unread" />}</td>
      <td>{form.created.toFormat('LLL d, yyyy')}</td>
      <td>{form.status}</td>
      <td>
        <Tags urn={form.urn} onTag={onTag} />
      </td>
      {dataValues.map(({ path }) => (
        <DataValueCell key={path}>{form.values[path]}</DataValueCell>
      ))}
      <td>
        <GoabButtonGroup alignment="end">
          <GoabButton type="secondary" size="compact" onClick={() => navigate(form.id)}>
            Open
          </GoabButton>
        </GoabButtonGroup>
      </td>
    </tr>
  );
};

interface FormsProps {
  definitionId: string;
}

export const Forms: FunctionComponent<FormsProps> = ({ definitionId }) => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();

  const [showTagForm, setShowTagForm] = useState<Pick<Resource, 'name' | 'urn'>>(null);
  const [showExport, setShowExport] = useState(false);

  const directoryBusy = useSelector(directoryBusySelector);
  const canExport = useSelector(canExportSelector);
  const busy = useSelector(formBusySelector);
  const definition = useSelector(definitionSelector);
  const forms = useSelector(formsSelector);
  const dataValues = useSelector(selectedDataValuesSelector);
  const criteria = useSelector(formCriteriaSelector);
  const { forms: next } = useSelector(nextSelector);
  const formsExport = useSelector(formsExportSelector);

  useEffect(() => {
    if (forms.length < 1) {
      dispatch(findForms({ definitionId, criteria }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch, definitionId]);

  useEffect(() => {
    if (definition?.supportTopic) {
      dispatch(connectStream({ stream: 'form-questions-updates', typeId: 'form-questions' }));
    }
  }, [dispatch, definition]);

  return (
    <SearchLayout
      searchForm={
        <form>
          <SearchFormItemsContainer>
            <TagSearchFilter
              value={criteria.tag}
              onChange={(value) =>
                dispatch(
                  formActions.setFormCriteria({
                    ...criteria,
                    tag: value,
                  })
                )
              }
            />
            <GoabFormItem label="Status" mr="m">
              <GoabDropdown
                name="form-status"
                disabled={!!criteria.tag}
                value={criteria.statusEquals}
                onChange={(detail: GoabDropdownOnChangeDetail) =>
                  dispatch(
                    formActions.setFormCriteria({
                      ...criteria,
                      statusEquals: detail.value,
                    })
                  )
                }
              >
                <GoabDropdownItem value="" label="<No status filter>" />
                <GoabDropdownItem value="submitted" label="Submitted" />
                <GoabDropdownItem value="draft" label="Draft" />
                <GoabDropdownItem value="archived" label="Archived" />
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
                    formActions.setFormCriteria({
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
              onClick={() => dispatch(formActions.setFormCriteria({ statusEquals: 'submitted' }))}
            >
              Reset filter
            </GoabButton>
            <GoabButton
              type="primary"
              leadingIcon="search"
              disabled={busy.loading}
              onClick={() => dispatch(findForms({ definitionId, criteria }))}
            >
              Find forms
            </GoabButton>
          </GoabButtonGroup>
        </form>
      }
    >
      <ContentContainer>
        <GoabTable width="100%">
          <thead>
            <tr>
              <th></th>
              <th>Created on</th>
              <th>Status</th>
              <th>Tags</th>
              {dataValues.map(({ name, path }) => (
                <th key={path}>{name}</th>
              ))}
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {forms.map((form) => (
              <FormRow
                key={form.urn}
                dispatch={dispatch}
                navigate={navigate}
                hasSupportTopic={definition?.supportTopic}
                form={form}
                dataValues={dataValues}
                onTag={() => setShowTagForm({ name: '', urn: form.urn })}
              />
            ))}
            <RowSkeleton columns={5 + dataValues.length} show={busy.loading} />
            <RowLoadMore
              columns={4 + dataValues.length}
              next={next}
              loading={busy.loading}
              onLoadMore={(after) => dispatch(findForms({ definitionId, criteria, after }))}
            />
          </tbody>
        </GoabTable>
      </ContentContainer>
      <AddTagModal
        open={!!showTagForm}
        resource={showTagForm}
        tagging={directoryBusy.executing}
        onClose={() => setShowTagForm(null)}
        onTag={async (urn, label) => {
          await dispatch(tagResource({ urn, label }));
          setShowTagForm(null);
        }}
      />
      <ExportModal
        open={showExport}
        heading="Export forms to file"
        state={formsExport}
        onClose={() => setShowExport(false)}
        onStartExport={(format) => dispatch(exportForms({ definitionId, criteria, format }))}
      />
    </SearchLayout>
  );
};
