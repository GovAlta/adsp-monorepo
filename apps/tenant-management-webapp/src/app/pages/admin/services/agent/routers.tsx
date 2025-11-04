import React from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { Agent } from './agent';
import { AgentEditor } from './agentEditor';

export const AgentRouter = () => {
  return (
    <Routes>
      <Route path="/edit/:id" element={<AgentEditor />} />
      <Route path="/:tab" element={<Agent />} />
      <Route path="*" element={<Navigate to="overview" />} />
    </Routes>
  );
};
