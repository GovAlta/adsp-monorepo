import React from 'react';
import Header from '../../header';
import { Container, Row, Col } from 'react-bootstrap';
import Sidebar from './sidebar';
import Dashboard from './dashboard';
import { Route, Switch } from 'react-router-dom';
import Adminstration from './adminstration';
const TenantManagement = () => {
  return (
    <div>
      <div className="goa-admin-header">
        <Header
          url={'/login'}
          urlName="Sign In"
          serviceName="Alberta Digital Service Platform - Tenant Management"
        />
      </div>
      <Container fluid style={{ paddingLeft: '25px' }}>
        <Row>
          <Col xs={12} md={6} lg={2}>
            <Sidebar />
          </Col>
          <Col xs={12} md={6} lg={10}>
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
