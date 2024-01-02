import { FunctionComponent, ReactElement, ReactNode } from 'react';
import { useSelector } from 'react-redux';
import { userSelector } from '../state';
import { GoACallout } from '@abgov/react-components-new';
import styled from 'styled-components';

interface AuthorizeUserProps {
  roles?: string[];
  children: ReactElement;
}

const Placeholder = styled.div`
  padding: 48px;
`;

export const AuthorizeUser: FunctionComponent<AuthorizeUserProps> = ({ roles, children }) => {
  const { initialized, user } = useSelector(userSelector);

  return initialized ? (
    user && (!roles?.length || roles.find((r) => user.roles?.includes(r))) ? (
      children
    ) : (
      // Not authorized placeholder; in this state the user has been resolved and doesn't satisfy access requirement.
      <Placeholder>
        <GoACallout heading="Not authorized" type="information">
          Sign in {roles?.length ? 'as a user with a permitted role' : ''} for access.
        </GoACallout>
      </Placeholder>
    )
  ) : // Not initialized placeholder; in this state we don't know yet if there is a logged in user.
  null;
};
