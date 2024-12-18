import { FunctionComponent, useEffect } from 'react';
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
} from '../state';
import { SearchLayout } from '../components/SearchLayout';
import { ContentContainer } from '../components/ContentContainer';
import { DataValueCell } from '../components/DataValueCell';

interface FormsProps {
  definitionId: string;
}

export const Forms: FunctionComponent<FormsProps> = ({ definitionId }) => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();

  const busy = useSelector(busySelector);
  const forms = useSelector(formsSelector);
  const columns = useSelector(selectedDataValuesSelector);
  const criteria = useSelector(formCriteriaSelector);
  const { forms: next } = useSelector(nextSelector);

  useEffect(() => {
    if (forms.length < 1) {
      dispatch(findForms({ definitionId, criteria }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [definitionId, dispatch, forms]);

  return (
    <SearchLayout
      searchForm={
        <form>
          <GoAFormItem label="Status">
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
              <GoADropdownItem value={null} label="All" />
            </GoADropdown>
          </GoAFormItem>
          <GoAButtonGroup alignment="end">
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
              {columns.map(({ name }) => (
                <th>{name}</th>
              ))}
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {forms.map((form) => (
              <tr key={form.urn}>
                <td>{form.created.toFormat('LLL dd, yyyy')}</td>
                <td>{form.status}</td>
                {columns.map(({ path }) => (
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
              <td colSpan={3 + columns.length}>
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
            )}
          </tbody>
        </GoATable>
      </ContentContainer>
    </SearchLayout>
  );
};
