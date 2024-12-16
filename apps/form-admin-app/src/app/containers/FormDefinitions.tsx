import { FunctionComponent, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, definitionsSelector, loadDefinitions } from '../state';
import { GoAButton, GoAButtonGroup, GoATable } from '@abgov/react-components-new';
import { useNavigate } from 'react-router-dom';
import { SearchLayout } from '../components/SearchLayout';
import { ContentContainer } from '../components/ContentContainer';

export const FormsDefinitions = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();

  useEffect(() => {
    dispatch(loadDefinitions());
  }, [dispatch]);

  const definitions = useSelector(definitionsSelector);

  return (
    <SearchLayout searchForm={<form></form>}>
      <ContentContainer>
        <GoATable width="100%">
          <thead>
            <tr>
              <th>Name</th>
              <th>Anonymous applicant</th>
              <th>Creates submissions</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {definitions.map((definition) => (
              <tr key={definition.id}>
                <td>{definition.name}</td>
                <td>{definition.anonymousApply ? 'Yes' : 'No'}</td>
                <td>{definition.submissionRecords ? 'Yes' : 'No'}</td>
                <td>
                  <GoAButtonGroup alignment="end">
                    <GoAButton type="secondary" size="compact" onClick={() => navigate(definition.id)}>
                      Select
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
