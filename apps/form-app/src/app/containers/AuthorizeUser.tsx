import { FunctionComponent, ReactElement } from 'react';
import { useSelector } from 'react-redux';
import { userSelector } from '../state';
import { SignInStartApplication } from '../components/SignInStartApplication';

interface AuthorizeUserProps {
  roles?: string[];
  children: ReactElement;
}

export const AuthorizeUser: FunctionComponent<AuthorizeUserProps> = ({ roles, children }) => {
  const { initialized, user } = useSelector(userSelector);

  return initialized ? (
    user && (!roles?.length || roles.find((r) => user.roles?.includes(r))) ? (
      children
    ) : (
      <SignInStartApplication />
    )
  ) : // Not initialized placeholder; in this state we don't know yet if there is a logged in user.
  null;
};
