import {
  GoAButton,
  GoAButtonGroup,
  GoADropdown,
  GoADropdownItem,
  GoAFormItem,
  GoATable,
} from '@abgov/react-components-new';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, criteriaSelector, findSubmissions, formActions, submissionsSelector } from '../state';
import { FunctionComponent, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ContentContainer } from '../components/ContentContainer';
import { SearchLayout } from '../components/SearchLayout';

interface FormSubmissionsProps {
  definitionId: string;
}

export const FormSubmissions: FunctionComponent<FormSubmissionsProps> = ({ definitionId }) => {
  const dispatch = useDispatch<AppDispatch>();
  const criteria = useSelector(criteriaSelector);
  const submissions = useSelector(submissionsSelector);

  const navigate = useNavigate();

  useEffect(() => {
    dispatch(findSubmissions({ definitionId }));
  }, [definitionId, dispatch]);

  return (
    <SearchLayout
      searchForm={
        <form>
          <GoAFormItem label="Disposition">
            <GoADropdown
              value={
                typeof criteria['dispositioned'] !== 'boolean'
                  ? 'all'
                  : criteria['dispositioned'] === true
                  ? 'dispositioned'
                  : 'not dispositioned'
              }
              onChange={(_, values) => {
                dispatch(
                  formActions.setFormSubmissionCriteria({
                    ...criteria,
                    dispositioned: values === 'all' ? undefined : values === 'dispositioned',
                  })
                );
              }}
            >
              <GoADropdownItem value="not dispositioned" label="Not dispositioned" />
              <GoADropdownItem value="dispositioned" label="Dispositioned" />
              <GoADropdownItem value="all" label="All" />
            </GoADropdown>
          </GoAFormItem>
          <GoAButtonGroup alignment="end">
            <GoAButton
              type="secondary"
              onClick={() => dispatch(formActions.setFormSubmissionCriteria({ dispositioned: false }))}
            >
              Reset
            </GoAButton>
            <GoAButton type="primary" onClick={() => dispatch(findSubmissions({ definitionId, criteria }))}>
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
              <th>Submitted on</th>
              <th>Created by</th>
              <th>Disposition</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {submissions.map((submission) => (
              <tr key={submission.urn}>
                <td>{submission.created.toFormat('LLL dd, yyyy')}</td>
                <td>{submission.createdBy.name}</td>
                <td>{submission.disposition?.status}</td>
                <td>
                  <GoAButtonGroup alignment="end">
                    <GoAButton type="secondary" size="compact" onClick={() => navigate(`submissions/${submission.id}`)}>
                      Open
                    </GoAButton>
                  </GoAButtonGroup>
                </td>
              </tr>
            ))}
          </tbody>
        </GoATable>
      </ContentContainer>
    </SearchLayout>
  );
};
