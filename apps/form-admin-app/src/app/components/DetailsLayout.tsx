import { GoAButton, GoAButtonGroup } from '@abgov/react-components-new';
import { FunctionComponent, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { LoadingIndicator } from './LoadingIndicator';

const DetailsLayoutContainer = styled.div`
  position: absolute;
  top: 0;
  bottom: 0;
  left: 0;
  right: 0;
  display: flex;
  flex-direction: column;
  & > :first-child {
    background: var(--goa-color-greyscale-100);
    border-bottom: 1px solid var(--goa-color-greyscale-200);
    flex: 0;
  }
  & > :last-child {
    background: var(--goa-color-greyscale-100);
    border-top: 1px solid var(--goa-color-greyscale-200);
    flex: 0;
    padding-top: var(--goa-space-m);
    padding-bottom: var(--goa-space-s);
    padding-left: var(--goa-space-s);
    padding-right: var(--goa-space-s);
  }
`;

interface DetailsLayoutProps {
  initialized: boolean;
  header: ReactNode;
  children: ReactNode;
  actionsForm: ReactNode;
}

export const DetailsLayout: FunctionComponent<DetailsLayoutProps> = ({
  initialized,
  header,
  children,
  actionsForm,
}) => {
  const navigate = useNavigate();

  return (
    <DetailsLayoutContainer>
      <div>
        <GoAButtonGroup alignment="start" mt="s" ml="s">
          <GoAButton type="secondary" leadingIcon="arrow-back" onClick={() => navigate(-1)}>
            Back
          </GoAButton>
        </GoAButtonGroup>
        {header}
      </div>
      {initialized ? (
        <>
          {children}
          {actionsForm}
        </>
      ) : (
        <LoadingIndicator isLoading={true} />
      )}
    </DetailsLayoutContainer>
  );
};
