import React, { useState } from 'react';
import { Nav, Navbar } from 'react-bootstrap';
import { withRouter } from 'react-router';
import { useHistory } from 'react-router-dom';

const Side = () => {
  const history = useHistory();
  const [expanded, setExpanded] = useState(false);
  const toggleClicked = () => {
    setExpanded(!expanded);
    document.getElementById('dashboard').style.marginLeft = expanded
      ? '0px'
      : '100px';
  };
  return (
    <div className="col-md-12 goa-admin-side" id="sidebar">
      <Navbar collapseOnSelect expanded={expanded} sticky="top" expand="lg">
        <Navbar.Toggle
          aria-controls="basic-navbar-nav"
          onClick={toggleClicked}
        />
        <Navbar.Collapse id="basic-navbar-nav">
          <Nav
            variant="pills"
            className="flex-column mr-auto"
            style={{ width: '100%' }}
          >
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
        </Navbar.Collapse>
      </Navbar>
    </div>
  );
};
const SideBar = withRouter(Side);
export default SideBar;
