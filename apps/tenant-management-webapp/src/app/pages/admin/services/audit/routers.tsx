import React from 'react';
import { Route, Routes } from 'react-router-dom';
import { Audit } from './audit';

export const AuditRouter = () => {
  return (
    <Routes>
      <Route path="/" element={<Audit />} />
    </Routes>
  );
};
