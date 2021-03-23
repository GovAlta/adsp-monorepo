import React, { useState } from 'react';
import { Nav, Navbar } from 'react-bootstrap';
import { withRouter } from 'react-router';
import { Link } from 'react-router-dom';

const Side = () => {
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
          <Nav className="flex-column mr-auto" style={{ width: '100%' }}>
            <h4>Tenant Name</h4>
            <Link to="/tenant-admin/admin">Administration</Link>
            <Link to="/tenant-admin">Dashboard</Link>

            <h4>Services</h4>
            <Link to="/tenant-admin/access">Access</Link>
            {/*<Link to="/tenant-admin/services/file">File Services</Link>
            <Link to="/notifications">Notifications</Link>
            <Link to="/app-status">App Status</Link>*/}
          </Nav>
        </Navbar.Collapse>
      </Navbar>
    </div>
  );
};
const SideBar = withRouter(Side);
export default SideBar;
