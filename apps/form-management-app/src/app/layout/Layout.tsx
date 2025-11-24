import React, { ReactNode } from 'react';
import { useSelector } from 'react-redux';
import { selectIsAuthenticated, selectUserName, selectUserEmail, selectTenant } from '../state/user/selectors';
import { UserInfo, Tenant } from '../models';
import AppHeader from '../components/AppHeader/AppHeader';
import styles from './Layout.module.scss';

interface LayoutProps {
  children: ReactNode;
  serviceName?: string;
  hasLoginLink?: boolean;
  admin?: boolean;
  showHeader?: boolean;
  showFooter?: boolean;
}

const Layout: React.FC<LayoutProps> = ({
  children,
  serviceName = 'Form Management',
  hasLoginLink = true,
  admin = false,
  showHeader = true,
  showFooter = true,
}) => {
  // Centralized state management
  const authenticated = useSelector(selectIsAuthenticated);
  const userName = useSelector(selectUserName);
  const userEmail = useSelector(selectUserEmail);
  const tenant = useSelector(selectTenant) as Tenant | undefined;

  const displayName = userName || userEmail || '';

  const userInfo: UserInfo = {
    authenticated,
    userName,
    userEmail,
    displayName,
  };

  return (
    <div className={styles.container}>
      {showHeader && (
        <AppHeader
          serviceName={serviceName}
          hasLoginLink={hasLoginLink}
          admin={admin}
          userInfo={userInfo}
          tenant={tenant}
        />
      )}

      <main className={styles.main}>{children}</main>

      {/* Footer can be added later when needed */}
    </div>
  );
};

export default Layout;
