import React from 'react';
import { Route, Routes } from 'react-router-dom-6';
import { TaskTenant } from './containers/TaskTenant';

export function PrivateApp(): JSX.Element {
  return (
    <div>
      <Routes>
        <Route path="/*" element={<TaskTenant />} />;
      </Routes>
    </div>
  );
}

export default PrivateApp;
