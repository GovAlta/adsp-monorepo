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
  formFilterCountSelector,
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
  formResultTotalsSelector,
  formSortSelector,
  DATA_VALUE_SORT_PREFIX,
} from '../state';
import { FilterDrawerLayout } from '../components/FilterDrawerLayout';
import { ContentContainer } from '../components/ContentContainer';
import { DataValueCell } from '../components/DataValueCell';
import { ExportModal } from '../components/ExportModal';
import { FilterFormItemsContainer } from '../components/FilterFormItemsContainer';
import { DataValueCriteriaItem } from '../components/DataValueCriteriaItem';
import { DateRangeCriteriaItem, isSearchDisabled } from '../components/DateRangeCriteriaItem';
import { AddTagModal } from '../components/AddTagModal';
import { Tags } from './Tags';
import { TagSearchFilter } from './TagSearchFilter';
import { GoabDropdownOnChangeDetail, GoabTableOnSortDetail } from '@abgov/ui-components-common';
import { ResultsSummary } from '../components/ResultsSummary';
import { SortableColumnHeader, toSortChange } from '../components/SortableColumnHeader';

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
      {dataValues.map(({ path }) => {
        const value = form.values[path];
        return (
          <DataValueCell key={path}>
            {value !== null && typeof value === 'object' ? JSON.stringify(value) : (value as string)}
          </DataValueCell>
        );
      })}
      <td>
        <GoabButtonGroup alignment="end">
          <GoabButton size="compact" type="secondary" onClick={() => navigate(form.id)}>
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
  const sort = useSelector(formSortSelector);
  const activeFilterCount = useSelector(formFilterCountSelector);
  const { forms: next } = useSelector(nextSelector);
  const { forms: totalForms } = useSelector(formResultTotalsSelector);
  const formsExport = useSelector(formsExportSelector);

  useEffect(() => {
    if (forms.length < 1) {
      dispatch(findForms({ definitionId, criteria, sort }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch, definitionId]);

  useEffect(() => {
    if (definition?.supportTopic) {
      dispatch(connectStream({ stream: 'form-questions-updates', typeId: 'form-questions' }));
    }
  }, [dispatch, definition]);

  // The table wires up its sort headers when it mounts, so it is remounted when the data value
  // columns of the definition are loaded and the set of sortable columns changes.
  const sortableColumnsKey = dataValues.map(({ path }) => path).join('|');
  const searchDisabled = isSearchDisabled(busy.loading, criteria);
  const updateCriteria = (update: typeof criteria) => dispatch(formActions.setFormCriteria(update)); // clean-code-ignore: 2.10
  const handleFindForms = (after?: string) => dispatch(findForms({ definitionId, criteria, sort, after })); // clean-code-ignore: 2.10
  const clearFilters = () => {
    const criteria = {};
    dispatch(formActions.setFormCriteria(criteria));
    dispatch(findForms({ definitionId, criteria, sort }));
  };
  const handleSort = (detail: GoabTableOnSortDetail) => {
    const update = toSortChange(detail, sort);
    if (update) {
      dispatch(formActions.setFormSort(update));
      dispatch(findForms({ definitionId, criteria, sort: update }));
    }
  };

  return (
    <FilterDrawerLayout
      activeFilterCount={activeFilterCount}
      toolbarActions={
        canExport && (
          <GoabButton
            type="tertiary"
            size="compact"
            testId="export-forms"
            disabled={!!criteria.tag}
            onClick={() => setShowExport(true)}
          >
            Export to file
          </GoabButton>
        )
      }
      filters={
        <form>
          <FilterFormItemsContainer>
            <DateRangeCriteriaItem
              fromValue={criteria.createDateAfter}
              toValue={criteria.createDateBefore}
              disabled={!!criteria.tag}
              onChangeFrom={(value) => updateCriteria({ ...criteria, createDateAfter: value })}
              onChangeTo={(value) => updateCriteria({ ...criteria, createDateBefore: value })}
            />
            <TagSearchFilter value={criteria.tag} onChange={(value) => updateCriteria({ ...criteria, tag: value })} />
            <GoabFormItem label="Status" mr="m">
              <GoabDropdown
                size="compact"
                name="form-status"
                disabled={!!criteria.tag}
                value={criteria.statusEquals}
                onChange={(detail: GoabDropdownOnChangeDetail) =>
                  updateCriteria({ ...criteria, statusEquals: detail.value })
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
                  updateCriteria({
                    ...criteria,
                    dataCriteria: {
                      ...criteria?.dataCriteria,
                      [path]: value || undefined,
                    },
                  })
                }
              />
            ))}
          </FilterFormItemsContainer>
        </form>
      }
      filterActions={
        <GoabButtonGroup alignment="end">
          <GoabButton
            type="primary"
            size="compact"
            leadingIcon="search"
            testId="find-forms"
            disabled={searchDisabled}
            onClick={() => handleFindForms()}
          >
            Find forms
          </GoabButton>
        </GoabButtonGroup>
      }
    >
      <ContentContainer>
        <ResultsSummary
          visible={forms.length}
          total={totalForms}
          itemLabel="forms"
          loading={busy.loading}
          onClearFilters={clearFilters}
        />
        <GoabTable key={sortableColumnsKey} width="100%" onSort={handleSort}>
          <thead>
            <tr>
              <th></th>
              <SortableColumnHeader name="created" sort={sort}>
                Created on
              </SortableColumnHeader>
              <SortableColumnHeader name="status" sort={sort}>
                Status
              </SortableColumnHeader>
              <th>Tags</th>
              {dataValues.map(({ name, path }) => (
                <SortableColumnHeader key={path} name={`${DATA_VALUE_SORT_PREFIX}${path}`} sort={sort}>
                  {name}
                </SortableColumnHeader>
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
              onLoadMore={handleFindForms}
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
    </FilterDrawerLayout>
  );
};
