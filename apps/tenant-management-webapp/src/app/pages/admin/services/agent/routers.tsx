import React from 'react';
import { Route, Routes } from 'react-router-dom';
import { Agent } from './agent';
import { AgentEditor } from './agentEditor';

export const AgentRouter = () => {
  return (
    <Routes>
      <Route path="/" element={<Agent />} />
      <Route path="/edit/:id" element={<AgentEditor />} />
    </Routes>
  );
};
