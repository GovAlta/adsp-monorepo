import React, { FunctionComponent, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { GoabCallout, GoabContainer } from '@abgov/react-components';
import styled from 'styled-components';
import { Solutions } from './solutions';
import SolutionWorkplace from './SolutionWorkplace';

const Layout = styled.div`
  display: flex;
  gap: 1rem;
  align-items: flex-start;
  margin-top: 1rem;
`;

const Sidebar = styled.div`
  flex: 0 0 300px;
  min-width: 0;
  contain: layout inline-size;
`;

const Workspace = styled.div`
  flex: 1;
  min-width: 0;
  contain: layout inline-size;
`;

export const SolutionsWorkspace: FunctionComponent = () => {
  const { id } = useParams<{ id?: string }>();
  const navigate = useNavigate();
  const [refreshToken, setRefreshToken] = useState(0);
  const onSelect = (selectedId?: string) => navigate(selectedId ? `../solutions/${selectedId}` : '../solutions');

  return (
    <Layout>
      <Sidebar>
        <GoabContainer accent="thick" padding="compact">
          <Solutions selectedId={id} onSelect={onSelect} refreshToken={refreshToken} />
        </GoabContainer>
      </Sidebar>
      <Workspace>
        <GoabContainer accent="thick">
          {id ? (
            <SolutionWorkplace
              key={id}
              solutionId={id}
              onBack={() => onSelect(undefined)}
              onSolutionChanged={() => setRefreshToken((t) => t + 1)}
            />
          ) : (
            <GoabCallout type="information" heading="No solution selected" testId="no-solution-selected">
              Create a solution or choose one from the list to describe a business problem and get a pattern match.
            </GoabCallout>
          )}
        </GoabContainer>
      </Workspace>
    </Layout>
  );
};

export default SolutionsWorkspace;
