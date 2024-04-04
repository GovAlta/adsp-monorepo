import React from 'react';
import { Routes, Route } from 'react-router-dom';
import StatusPage from './status';

function Index(): JSX.Element {
  return (
    <Routes>
      <Route path="/" element={<StatusPage />} />
    </Routes>
  );
}

export default Index;
