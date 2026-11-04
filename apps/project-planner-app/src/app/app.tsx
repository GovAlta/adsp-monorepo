import '@style/app.css';
import '@style/colors.scss';
import '@abgov/web-components/index.css';
import '@abgov/design-tokens/dist/tokens.css';
import React, { FunctionComponent, ReactNode, useEffect } from 'react';
import {
  GoabAppFooter,
  GoabAppHeader,
  GoabButton,
  GoabCircularProgress,
  GoabMicrositeHeader,
  GoabNotification,
} from '@abgov/react-components';
import { useDispatch, useSelector } from 'react-redux';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import styled from 'styled-components';
import { AppDispatch, RootState } from './store';
import { DismissNotification } from './store/notifications/actions';
import { MessageType } from './store/notifications/models';
import { selectIsPlannerUser } from './store/session/selectors';
import { initializeSession, loginUser, logoutUser } from './store/session/slice';
import { ProjectPlannerRouter } from './planner';

const Notifications: FunctionComponent = () => {
  const dispatch = useDispatch<AppDispatch>();
  const notifications = useSelector((state: RootState) => state.notifications.notifications);

  return (
    <>
      {notifications.map((notification, index) => (
        <GoabNotification
          key={index}
          type={notification.type === MessageType.error ? 'emergency' : 'event'}
          onDismiss={() => dispatch(DismissNotification(notification))}
        >
          {notification.message}
        </GoabNotification>
      ))}
    </>
  );
};

const Layout: FunctionComponent<{ children: ReactNode }> = ({ children }) => {
  const dispatch = useDispatch<AppDispatch>();
  const session = useSelector((state: RootState) => state.session);

  return (
    <>
      <GoabMicrositeHeader type="beta" />
      <GoabAppHeader url="/" heading="Project planner">
        {session.authenticated && (
          <GoabButton type="tertiary" size="compact" testId="sign-out" onClick={() => dispatch(logoutUser())}>
            Sign out {session.userInfo?.name}
          </GoabButton>
        )}
      </GoabAppHeader>
      <Notifications />
      <Content>{children}</Content>
      <GoabAppFooter />
    </>
  );
};

export const AppContent: FunctionComponent = () => {
  const dispatch = useDispatch<AppDispatch>();
  const session = useSelector((state: RootState) => state.session);
  const isPlannerUser = useSelector(selectIsPlannerUser);

  let content: ReactNode;
  if (!session.initialized) {
    content = <GoabCircularProgress visible message="Loading..." />;
  } else if (!session.authenticated) {
    content = (
      <section>
        <h1>Project planner</h1>
        <p>
          Describe a business problem, and the planner recommends which ADSP services could help. Sign in with your
          Government of Alberta account to start.
        </p>
        <GoabButton testId="sign-in" onClick={() => dispatch(loginUser())}>
          Sign in
        </GoabButton>
      </section>
    );
  } else if (!isPlannerUser) {
    content = (
      <section>
        <h1>Project planner</h1>
        <p>You don't have access to the project planner.</p>
      </section>
    );
  } else {
    content = (
      <Routes>
        <Route path="/*" element={<ProjectPlannerRouter />} />
      </Routes>
    );
  }

  return <Layout>{content}</Layout>;
};

export function App() {
  const dispatch = useDispatch<AppDispatch>();
  const configReady = useSelector((state: RootState) => state.config.initialized);

  useEffect(() => {
    if (configReady) {
      dispatch(initializeSession());
    }
  }, [configReady, dispatch]);

  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}

export default App;

const Content = styled.main`
  min-height: 60vh;
  padding: var(--goa-space-l) 0;
`;
