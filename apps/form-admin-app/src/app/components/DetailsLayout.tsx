import { GoAButton, GoAButtonGroup } from '@abgov/react-components-new';
import { FunctionComponent, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';

const DetailsLayoutContainer = styled.div`
  position: absolute;
  top: 0;
  bottom: 0;
  left: 0;
  right: 0;
  display: flex;
  flex-direction: column;
`;

interface DetailsLayoutProps {
  children: ReactNode;
}

export const DetailsLayout: FunctionComponent<DetailsLayoutProps> = ({ children }) => {
  const navigate = useNavigate();

  return (
    <DetailsLayoutContainer>
      <GoAButtonGroup alignment="start" mt="s" ml="s" mb="s">
        <GoAButton type="secondary" onClick={() => navigate('..')}>
          Back
        </GoAButton>
      </GoAButtonGroup>
      {children}
    </DetailsLayoutContainer>
  );
};
