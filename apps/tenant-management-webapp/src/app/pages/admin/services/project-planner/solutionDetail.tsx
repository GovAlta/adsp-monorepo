import React, { FunctionComponent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Page, Main } from '@components/Html';
import SolutionWorkplace from './SolutionWorkplace';

export const SolutionDetail: FunctionComponent = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  return (
    <Page>
      <Main>
        <SolutionWorkplace key={id} solutionId={id} onBack={() => navigate('../solutions')} />
      </Main>
    </Page>
  );
};
