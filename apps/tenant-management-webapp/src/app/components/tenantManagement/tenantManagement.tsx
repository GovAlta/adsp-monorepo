import React from 'react';
import Header from '../../header';
import { Container, Row, Col } from 'react-bootstrap';
import Sidebar from './sidebar';
import Dashboard from './dashboard';
import { Route, Switch } from 'react-router-dom';
import Adminstration from './administration';
const TenantManagement = () => {
  return (
    <div style={{ overflowX: 'hidden' }}>
      <div className="goa-admin-header">
        <Header
          url={'/login'}
          urlName="Sign In"
          serviceName="Alberta Digital Service Platform - Tenant Management"
        />
      </div>
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
            </Switch>
          </Col>
        </Row>
      </Container>
    </div>
  );
};
export default TenantManagement;
