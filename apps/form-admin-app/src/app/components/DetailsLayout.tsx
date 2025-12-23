import { GoabButton, GoabButtonGroup } from '@abgov/react-components';
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
  & > :first-child [trailingicon='arrow-forward'] {
    margin-left: auto;
  }
`;

interface DetailsLayoutProps {
  initialized: boolean;
  navButtons?: ReactNode;
  nextTo?: string;
  header: ReactNode;
  children: ReactNode;
  actionsForm?: ReactNode;
}

export const DetailsLayout: FunctionComponent<DetailsLayoutProps> = ({
  initialized,
  navButtons,
  nextTo,
  header,
  children,
  actionsForm,
}) => {
  const navigate = useNavigate();

  return (
    <DetailsLayoutContainer>
      <div>
        <GoabButtonGroup alignment="start" mt="s" ml="s" mr="s">
          <GoabButton type="secondary" leadingIcon="arrow-back" onClick={() => navigate(-1)}>
            Back
          </GoabButton>
          {navButtons}
          {nextTo && (
            <GoabButton type="secondary" trailingIcon="arrow-forward" onClick={() => navigate(nextTo)}>
              Next
            </GoabButton>
          )}
        </GoabButtonGroup>
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
