import { GoAButton, GoAButtonGroup, GoATable } from '@abgov/react-components-new';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, findSubmissions, submissionsSelector } from '../state';
import { FunctionComponent, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

interface FormSubmissionsProps {
  definitionId: string;
}

export const FormSubmissions: FunctionComponent<FormSubmissionsProps> = ({ definitionId }) => {
  const dispatch = useDispatch<AppDispatch>();
  const submissions = useSelector(submissionsSelector);

  const navigate = useNavigate();

  useEffect(() => {
    dispatch(findSubmissions({ definitionId }));
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
            <th>Disposition</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {submissions.map((submission) => (
            <tr key={submission.urn}>
              <td>{submission.created.toISOString()}</td>
              <td>{submission.createdBy.name}</td>
              <td>{submission.disposition?.status}</td>
              <td>
                <GoAButtonGroup alignment="end">
                  <GoAButton type="secondary" onClick={() => navigate(`submissions/${submission.id}`)}>
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
