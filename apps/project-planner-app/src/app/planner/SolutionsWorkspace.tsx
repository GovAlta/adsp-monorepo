import React, { FunctionComponent, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { GoabContainer } from '@abgov/react-components';
import { Solutions } from './solutions';
import SolutionWorkplace from './SolutionWorkplace';

export const SolutionsWorkspace: FunctionComponent = () => {
  const { id } = useParams<{ id?: string }>();
  const navigate = useNavigate();
  const [refreshToken, setRefreshToken] = useState(0);
  const onSelect = (selectedId?: string) => navigate(selectedId ? `../solutions/${selectedId}` : '../solutions');

  return (
    <GoabContainer accent="thick">
      {id ? (
        <SolutionWorkplace
          key={id}
          solutionId={id}
          onBack={() => onSelect(undefined)}
          onSolutionChanged={() => setRefreshToken((t) => t + 1)}
        />
      ) : (
        <Solutions selectedId={id} onSelect={onSelect} refreshToken={refreshToken} />
      )}
    </GoabContainer>
  );
};

export default SolutionsWorkspace;
