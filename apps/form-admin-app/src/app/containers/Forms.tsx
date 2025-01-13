import { FunctionComponent, useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  GoAButton,
  GoAButtonGroup,
  GoADropdown,
  GoADropdownItem,
  GoAFormItem,
  GoATable,
} from '@abgov/react-components-new';
import { useNavigate } from 'react-router-dom';
import {
  AppDispatch,
  busySelector,
  selectedDataValuesSelector,
  findForms,
  formActions,
  formCriteriaSelector,
  formsSelector,
  nextSelector,
  canExportSelector,
  exportForms,
  formsExportSelector,
} from '../state';
import { SearchLayout } from '../components/SearchLayout';
import { ContentContainer } from '../components/ContentContainer';
import { DataValueCell } from '../components/DataValueCell';
import { ExportModal } from '../components/ExportModal';
import { SearchFormItemsContainer } from '../components/SearchFormItemsContainer';
import { DataValueCriteriaItem } from '../components/DataValueCriteriaItem';

interface FormsProps {
  definitionId: string;
}

export const Forms: FunctionComponent<FormsProps> = ({ definitionId }) => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();

  const [showExport, setShowExport] = useState(false);

  const canExport = useSelector(canExportSelector);
  const busy = useSelector(busySelector);
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

  return (
    <SearchLayout
      searchForm={
        <form>
          <SearchFormItemsContainer>
            <GoAFormItem label="Status" mr="m">
              <GoADropdown
                relative={true}
                name="form-status"
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
                <GoADropdownItem value="submitted" label="Submitted" />
                <GoADropdownItem value="draft" label="Draft" />
                <GoADropdownItem value="archived" label="Archived" />
                <GoADropdownItem value={null} label="All" />
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
              <GoAButton type="tertiary" mr="xl" onClick={() => setShowExport(true)}>
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
              <th>Created on</th>
              <th>Status</th>
              {dataValues.map(({ name, path }) => (
                <th key={path}>{name}</th>
              ))}
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {forms.map((form) => (
              <tr key={form.urn}>
                <td>{form.created.toFormat('LLL dd, yyyy')}</td>
                <td>{form.status}</td>
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
            ))}
            {next && (
              <tr>
                <td colSpan={3 + dataValues.length}>
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
