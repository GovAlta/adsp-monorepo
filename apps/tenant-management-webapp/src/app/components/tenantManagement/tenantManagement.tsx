import React, { useContext, useEffect } from 'react';
import { Container, Row, Col } from 'react-bootstrap';
import { Route, Switch } from 'react-router-dom';
import { useDispatch } from 'react-redux';

import Sidebar from './sidebar';
import Dashboard from './dashboard';
import Adminstration from './administration';
import { HeaderCtx } from '../../baseApp';
import File from './services/file';
import AccessPage from './services/access/access';
import { keycloak } from '../../services/session';
import { CredentialRefresh } from '../../store/session/actions';

const TenantManagement = () => {
  const { setTitle } = useContext(HeaderCtx);
  const dispatch = useDispatch();

  useEffect(() => {
    setTitle('Alberta Digital Service Platform - Tenant Management');
  }, [setTitle]);

  useEffect(() => {
    setInterval(async () => {
      const refreshed = await keycloak.updateToken(50)
      if (refreshed) {
        dispatch(CredentialRefresh({
          token: keycloak.token,
          tokenExp: keycloak.tokenParsed.exp,
        }))
      }
    }, 4000)
  }, [dispatch])

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
