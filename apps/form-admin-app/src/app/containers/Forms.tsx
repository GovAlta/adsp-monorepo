import { FunctionComponent, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, findForms, formsSelector } from '../state';
import { GoAButton, GoAButtonGroup, GoATable } from '@abgov/react-components-new';
import { useNavigate } from 'react-router-dom';
import { SearchLayout } from '../components/SearchLayout';

interface FormsProps {
  definitionId: string;
}

export const Forms: FunctionComponent<FormsProps> = ({ definitionId }) => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();

  const forms = useSelector(formsSelector);

  useEffect(() => {
    dispatch(findForms({ definitionId }));
  }, [definitionId, dispatch]);

  return (
    <SearchLayout
      searchForm={
        <form>
          <GoAButtonGroup alignment="end">
            <GoAButton type="secondary">Reset</GoAButton>
            <GoAButton type="primary">Search</GoAButton>
          </GoAButtonGroup>
        </form>
      }
    >
      <GoATable width="100%">
        <thead>
          <tr>
            <th>Submitted on</th>
            <th>Created by</th>
            <th>Applicant</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {forms.map((form) => (
            <tr key={form.urn}>
              <td>{form.created.toFormat('LLL dd, yyyy')}</td>
              <td>{form.createdBy.name}</td>
              <td>{form.applicant?.addressAs}</td>
              <td>
                <GoAButtonGroup alignment="end">
                  <GoAButton type="secondary" size="compact" onClick={() => navigate(`forms/${form.id}`)}>
                    Open
                  </GoAButton>
                </GoAButtonGroup>
              </td>
            </tr>
          ))}
        </tbody>
      </GoATable>
    </SearchLayout>
  );
};
