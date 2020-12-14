import React from 'react';
import { Nav } from 'react-bootstrap';
import { withRouter } from 'react-router';
import { useHistory } from 'react-router-dom';

const Side = () => {
  const history = useHistory();
  return (
    <div className="goa-admin-side">
      <Nav variant="pills" className="flex-column">
        <h4>Tenant Name</h4>
        <Nav.Link
          eventKey="dashboard"
          onClick={() => history.push('/tenant-admin')}
        >
          Dashboard
        </Nav.Link>
        <Nav.Link
          eventKey="administration"
          onClick={() => history.push('/tenant-admin/admin')}
        >
          Administration
        </Nav.Link>
        <h4>Services</h4>
        <Nav.Link href="https://access-dev.os99.gov.ab.ca/auth/">
          Access
        </Nav.Link>
        <Nav.Link href="/file-service">File Services</Nav.Link>
        <Nav.Link href="/notifications">Notifications</Nav.Link>
        <Nav.Link href="/app-status">App Status</Nav.Link>
      </Nav>
    </div>
  );
};
const SideBar = withRouter(Side);
export default SideBar;
