import React from 'react';
import { Link } from 'react-router-dom';

const TenantManagement = (): JSX.Element => {
  return (
    <div>
      <h1>Form Management Dashboard</h1>
      <nav>
        <ul>
          <li>
            <Link to="./forms">Form Definitions</Link>
          </li>
          <li>
            <Link to="./editor/new">Form Editor</Link>
          </li>
          <li>
            <Link to="./preview/sample">Form Preview</Link>
          </li>
        </ul>
      </nav>
    </div>
  );
};

export default TenantManagement;
