import React from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { ProjectPlanner } from './projectPlanner';
import { SolutionDetail } from './solutionDetail';

export const ProjectPlannerRouter = () => {
  return (
    <Routes>
      <Route path="/solution/:id" element={<SolutionDetail />} />
      <Route path="/:tab" element={<ProjectPlanner />} />
      <Route path="*" element={<Navigate to="overview" />} />
    </Routes>
  );
};
