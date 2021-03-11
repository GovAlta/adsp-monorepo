import React, { useContext, useEffect, useState } from 'react';
import { Container, Row, Col } from 'react-bootstrap';
import { Route, Switch } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';

import Sidebar from './sidebar';
import Dashboard from './dashboard';
import Adminstration from './administration';
import { HeaderCtx } from '../../baseApp';
import File from './services/file';
import AccessPage from './services/access/access';
import { login } from '../../services/session'
import { ErrorNotification } from '../../store/notifications/actions';
import { RootState } from '../../store';
import { FetchTenantSuccess } from '../../store/tenant/actions';
import { Session } from '../../store/session/models';
import { SessionLoginSuccess } from '../../store/session/actions';

const TenantManagement = () => {
  const dispatch = useDispatch();
  const { setTitle } = useContext(HeaderCtx);
  const { keycloakConfig } = useSelector((state: RootState) => ({
    keycloakConfig: state.config?.keycloakApi,
  }));
  const [ loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    setTitle('Alberta Digital Service Platform - Tenant Management');
  }, []);

  useEffect(() => {
    login(keycloakConfig,
      (session: Session) => {
        dispatch(SessionLoginSuccess(session));
        dispatch(FetchTenantSuccess({ name: session.realm }));  // TODO: what is this for?
        setLoading(false)
      },
      (err: string) => {
        dispatch(ErrorNotification({ message: err }));
      }
    )
  }, [dispatch, keycloakConfig]);

  return (
   loading
      ? <div>Loading</div>
      : <Container fluid style={{ padding: '0 0 25px 20px' }}>
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
