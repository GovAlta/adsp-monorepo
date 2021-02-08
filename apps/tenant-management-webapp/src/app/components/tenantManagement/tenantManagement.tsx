import React, { useContext, useEffect } from 'react';
import { Container, Row, Col } from 'react-bootstrap';
import Sidebar from './sidebar';
import Dashboard from './dashboard';
import { Route, Switch } from 'react-router-dom';
import Adminstration from './administration';
import { HeaderCtx } from '../../baseApp';
import File from './services/file';

const TenantManagement = () => {
  const { setTitle } = useContext(HeaderCtx);

  useEffect(() => {
    setTitle('Alberta Digital Service Platform - Tenant Management');
  }, []);

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
