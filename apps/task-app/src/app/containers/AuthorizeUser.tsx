import React, { useEffect } from 'react';
import { GoACallout } from '@abgov/react-components-new';
import { FunctionComponent, ReactElement } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import styled from 'styled-components';
import { useSearchParams, useLocation } from 'react-router-dom-6';
import {
  userSelector,
  configInitializedSelector,
  AppDispatch,
  tenantSelector,
  loginUser,
  feedbackSelector,
} from '../state';

interface AuthorizeUserProps {
  roles?: string[];
  children: ReactElement;
}

const Placeholder = styled.div`
  padding: 48px;
`;

export const AuthorizeUser: FunctionComponent<AuthorizeUserProps> = ({ roles, children }) => {
  const [searchParams, _] = useSearchParams();
  const loggedOut = searchParams.get('logout');
  const location = useLocation();

  const dispatch = useDispatch<AppDispatch>();
  const { initialized, user } = useSelector(userSelector);
  const tenant = useSelector(tenantSelector);
  const feedback = useSelector(feedbackSelector);
  const error = feedback?.message.includes('Error encountered');

  useEffect(() => {
    if (tenant && user === null && !loggedOut && !error) {
      dispatch(loginUser({ tenant, from: location.pathname }));
    }
  }, [tenant, user, dispatch, loggedOut]);

  return initialized ? (
    user && (!roles?.length || roles.find((r) => user.roles?.includes(r))) ? (
      children
    ) : (
      // Not authorized placeholder; in this state the user has been resolved and doesn't satisfy access requirement.
      <div>
        <Placeholder>
          <GoACallout
            heading={loggedOut ? 'Successfully signed out' : error ? 'Login failed' : 'Not authorized'}
            type="information"
          >
            {loggedOut ? '' : error ? 'Error encountered' : 'Logging in...'}
          </GoACallout>
        </Placeholder>
      </div>
    )
  ) : // Not initialized placeholder; in this state we don't know yet if there is a logged in user.
  null;
};
