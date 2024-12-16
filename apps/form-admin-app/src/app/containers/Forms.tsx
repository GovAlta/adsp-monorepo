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
  findForms,
  formActions,
  formCriteriaSelector,
  formsSelector,
  nextSelector,
} from '../state';
import { SearchLayout } from '../components/SearchLayout';
import { ContentContainer } from '../components/ContentContainer';

interface FormsProps {
  definitionId: string;
}

export const Forms: FunctionComponent<FormsProps> = ({ definitionId }) => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();

  const busy = useSelector(busySelector);
  const forms = useSelector(formsSelector);
  const criteria = useSelector(formCriteriaSelector);
  const next = useSelector(nextSelector);

  useEffect(() => {
    dispatch(findForms({ definitionId, criteria }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [definitionId, dispatch]);

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
              Reset
            </GoAButton>
            <GoAButton
              type="primary"
              disabled={busy.loading}
              onClick={() => dispatch(findForms({ definitionId, criteria }))}
            >
              Search
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
              <th>Submitted on</th>
              <th>Status</th>
              <th>Applicant</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {forms.map((form) => (
              <tr key={form.urn}>
                <td>{form.created.toFormat('LLL dd, yyyy')}</td>
                <td>{form.submitted?.toFormat('LLL dd, yyyy')}</td>
                <td>{form.status}</td>
                <td>{form.applicant?.addressAs}</td>
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
              <td colSpan={5}>
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
