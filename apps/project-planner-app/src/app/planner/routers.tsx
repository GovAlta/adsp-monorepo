import React from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { ProjectPlanner } from './projectPlanner';

export const ProjectPlannerRouter = () => {
  return (
    <Routes>
      <Route path="/solutions/:id" element={<ProjectPlanner />} />
      <Route path="/:tab" element={<ProjectPlanner />} />
      <Route path="*" element={<Navigate to="overview" />} />
    </Routes>
  );
};
