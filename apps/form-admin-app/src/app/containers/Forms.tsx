import { FunctionComponent, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, findForms, formsSelector } from '../state';
import { GoAButton, GoAButtonGroup, GoAFormItem, GoATable } from '@abgov/react-components-new';
import { useNavigate } from 'react-router-dom';

interface FormsProps {
  definitionId: string;
}

export const Forms: FunctionComponent<FormsProps> = ({ definitionId }) => {
  const dispatch = useDispatch<AppDispatch>();
  const forms = useSelector(formsSelector);

  const navigate = useNavigate();

  useEffect(() => {
    dispatch(findForms({ definitionId }));
  }, [definitionId, dispatch]);

  return (
    <div>
      {/* <form>
        <GoAButtonGroup alignment="end">
          <GoAButton type="secondary">Reset</GoAButton>
          <GoAButton type="primary">Search</GoAButton>
        </GoAButtonGroup>
      </form> */}
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
              <td>{form.created.toISOString()}</td>
              <td>{form.createdBy.name}</td>
              <td>{form.applicant?.addressAs}</td>
              <td>
                <GoAButtonGroup alignment="end">
                  <GoAButton type="secondary" onClick={() => navigate(`forms/${form.id}`)}>
                    Open
                  </GoAButton>
                </GoAButtonGroup>
              </td>
            </tr>
          ))}
        </tbody>
      </GoATable>
    </div>
  );
};
