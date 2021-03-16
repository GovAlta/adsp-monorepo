import React, { useContext, useEffect, useState } from 'react';
import { Container, Row, Col } from 'react-bootstrap';
import { Route, Switch } from 'react-router-dom';

import Sidebar from './sidebar';
import Dashboard from './dashboard';
import Adminstration from './administration';
import { HeaderCtx } from '../../baseApp';
import File from './services/file';
import AccessPage from './services/access/access';
import { refreshToken } from '../../services/session';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../../store';
import { CredentialRefresh } from '../../store/session/actions';
import { Credentials } from '../../store/session/models';

const TenantManagement = () => {
  const { setTitle } = useContext(HeaderCtx);

  const dispatch = useDispatch();
  const { keycloakConfig } = useSelector((state: RootState) => ({
    keycloakConfig: state.config?.keycloakApi,
  }));

  useEffect(() => {
    setTitle('Alberta Digital Service Platform - Tenant Management');
  }, []);

  const [refreshingToken, setRefreshingToken] = useState(false);

  // refresh auth token
  useEffect(() => {
    const fetchToken = async () => {
      setRefreshingToken(true);
      try {
        const [refreshed, credentials] = await refreshToken();
        if (refreshed) {
          dispatch(CredentialRefresh(credentials as Credentials));
        }
      } catch (e) {
        console.log(`failed to refresh token: ${e}`)
      }
    }

    if (!refreshingToken) {
      setInterval(() => fetchToken(), 30 * 1000);
    }
  }, [dispatch, keycloakConfig, refreshingToken])

  return (
    <Container fluid style={{ padding: '0 0 25px 20px' }}>
      <Row>
        <Col xs={1} sm={2} className="goa-admin-sidebar-col">
          <Sidebar />
        </Col>
        <Col xs={11} sm={10} className="goa-admin-content-col">
          <Switch>
            <Route exact path="/tenant-admin/">
              <Dashboard />
            </Route>
            <Route exact path="/tenant-admin/admin">
              <Adminstration />
            </Route>
            <Route path="/tenant-admin/access">
              <AccessPage />
            </Route>

            <Route exact path="/tenant-admin/admin">
              <Adminstration />
            </Route>

            <Route exact path="/tenant-admin/services/file">
              <File />
            </Route>
          </Switch>
        </Col>
      </Row>
    </Container>
  );
};
export default TenantManagement;
