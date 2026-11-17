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
import { Page, Main } from '@components/Html';
import { AppDispatch, RootState } from './store';
import { DismissNotification } from './store/notifications/actions';
import { Notification, MessageType } from './store/notifications/models';
import { selectIsPlannerUser } from './store/session/selectors';
import { initializeSession, loginUser, logoutUser } from './store/session/slice';
import { ProjectPlannerRouter } from './planner';

const SUCCESS_NOTIFICATION_DISMISS_MS = 6000;

const NotificationItem = styled.div`
  margin-bottom: 2px;
`;

interface NotificationBannerProps {
  notification: Notification;
  onDismiss: () => void;
}

const NotificationBanner: FunctionComponent<NotificationBannerProps> = ({ notification, onDismiss }) => {
  useEffect(() => {
    if (notification.type !== MessageType.success) {
      return;
    }
    const timer = window.setTimeout(onDismiss, SUCCESS_NOTIFICATION_DISMISS_MS);
    return () => window.clearTimeout(timer);
  }, []);

  return (
    <NotificationItem>
      <GoabNotification type={notification.type === MessageType.error ? 'emergency' : 'event'} onDismiss={onDismiss}>
        {notification.message}
      </GoabNotification>
    </NotificationItem>
  );
};

const Notifications: FunctionComponent = () => {
  const dispatch = useDispatch<AppDispatch>();
  const notifications = useSelector((state: RootState) => state.notifications.notifications);

  return (
    <>
      {notifications.map((notification, index) => (
        <NotificationBanner
          key={notification.id ?? index}
          notification={notification}
          onDismiss={() => dispatch(DismissNotification(notification))}
        />
      ))}
    </>
  );
};

const Layout: FunctionComponent<{ children: ReactNode }> = ({ children }) => {
  const dispatch = useDispatch<AppDispatch>();
  const session = useSelector((state: RootState) => state.session);

  return (
    <ScrollContainer id="app-scroll-container">
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
    </ScrollContainer>
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
      <Page>
        <Main>
          <h1>Project planner</h1>
          <p>
            Describe a business problem, and the planner recommends which ADSP services could help. Sign in with your
            Government of Alberta account to start.
          </p>
          <GoabButton testId="sign-in" onClick={() => dispatch(loginUser())}>
            Sign in
          </GoabButton>
        </Main>
      </Page>
    );
  } else if (!isPlannerUser) {
    content = (
      <Page>
        <Main>
          <h1>Project planner</h1>
          <p>You don't have access to the project planner.</p>
        </Main>
      </Page>
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

// The shared global styles set html { overflow: hidden }, so the page scrolls in here instead, as in tenant admin.
const ScrollContainer = styled.div`
  position: absolute;
  top: 0;
  bottom: 0;
  left: 0;
  right: 0;
  overflow: auto;
  display: flex;
  flex-direction: column;
`;

// Fills the space left by the header and footer, so a short page has the footer at the bottom of the window.
const Content = styled.main`
  flex: 1 0 auto;
  padding: var(--goa-space-l) 0;
`;
