import React from 'react';
import styled from 'styled-components';
import Dashboard from './dashboard';
import {EditorWrapper }  from './Editor';
import { Route, Routes } from 'react-router-dom';

const TenantManagement = (): JSX.Element => {
  return (
    <div>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/edit/:id" element={<EditorWrapper />} />
      </Routes>
    </div>
  );
};

export default TenantManagement;
