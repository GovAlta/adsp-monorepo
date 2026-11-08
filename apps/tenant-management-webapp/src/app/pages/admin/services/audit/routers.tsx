import React from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { Audit } from './audit';
import { AuditEventPage } from './eventPage';

export const AuditRouter = () => {
  return (
    <Routes>
      <Route path="/events/:namespace/:id" element={<AuditEventPage />} />
      <Route path="/:tab" element={<Audit />} />
      <Route path="*" element={<Navigate to="overview" replace />} />
    </Routes>
  );
};
