import {
  GoAButton,
  GoAButtonGroup,
  GoADropdown,
  GoADropdownItem,
  GoAFormItem,
  GoAIcon,
  GoATable,
} from '@abgov/react-components-new';
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
import { RowSkeleton } from '../components/RowSkeleton';
import { AddTagModal } from '../components/AddTagModal';
import { Tags } from './Tags';
import { TagSearchFilter } from './TagSearchFilter';

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
    if (hasSupportTopic) {
      dispatch(loadTopic({ resourceId: form.urn, typeId: 'form-questions' }));
    }
  }, [dispatch, hasSupportTopic, form]);

  return (
    <tr key={form.urn}>
      <td>{topic?.requiresAttention && <GoAIcon type="mail-unread" size="small" />}</td>
      <td>{form.created.toFormat('LLL d, yyyy')}</td>
      <td>{form.status}</td>
      <td>
        <Tags urn={form.urn} onTag={onTag} />
      </td>
      {dataValues.map(({ path }) => (
        <DataValueCell key={path}>{form.values[path]}</DataValueCell>
      ))}
      <td>
        <GoAButtonGroup alignment="end">
          <GoAButton type="secondary" size="compact" onClick={() => navigate(form.id)}>
            Open
          </GoAButton>
        </GoAButtonGroup>
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
  }, [definitionId, dispatch]);

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
              value={criteria.tag || ''}
              onChange={(value) =>
                dispatch(
                  formActions.setFormCriteria({
                    ...criteria,
                    tag: value,
                  })
                )
              }
            />
            <GoAFormItem label="Status" mr="m">
              <GoADropdown
                relative={true}
                name="form-status"
                disabled={!!criteria.tag}
                value={criteria.statusEquals}
                onChange={(_, value: string) =>
                  dispatch(
                    formActions.setFormCriteria({
                      ...criteria,
                      statusEquals: value,
                    })
                  )
                }
              >
                <GoADropdownItem value="" label="<No status filter>" />
                <GoADropdownItem value="submitted" label="Submitted" />
                <GoADropdownItem value="draft" label="Draft" />
                <GoADropdownItem value="archived" label="Archived" />
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
          <GoAButtonGroup alignment="end" mt="l">
            {canExport && (
              <GoAButton type="tertiary" mr="xl" disabled={!!criteria.tag} onClick={() => setShowExport(true)}>
                Export to file
              </GoAButton>
            )}
            <GoAButton
              type="secondary"
              onClick={() => dispatch(formActions.setFormCriteria({ statusEquals: 'submitted' }))}
            >
              Reset filter
            </GoAButton>
            <GoAButton
              type="primary"
              leadingIcon="search"
              disabled={busy.loading}
              onClick={() => dispatch(findForms({ definitionId, criteria }))}
            >
              Find forms
            </GoAButton>
          </GoAButtonGroup>
        </form>
      }
    >
      <ContentContainer>
        <GoATable width="100%">
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
            {next && (
              <tr>
                <td colSpan={4 + dataValues.length}>
                  <GoAButtonGroup alignment="center">
                    <GoAButton
                      type="tertiary"
                      disabled={busy.loading}
                      onClick={() => dispatch(findForms({ definitionId, criteria, after: next }))}
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
