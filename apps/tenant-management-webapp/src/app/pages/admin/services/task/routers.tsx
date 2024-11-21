import React from 'react';
import { Route, Routes } from 'react-router-dom';
import { Task } from './task';
import { TaskDefinitionEditor } from './queue/TaskDefinationEditor';

export const TaskRouter = () => {
  return (
    <Routes>
      <Route path="/" element={<Task />} />
      <Route path="/edit/:id" element={<TaskDefinitionEditor />} />
      <Route path="/new" element={<TaskDefinitionEditor />} />
    </Routes>
  );
};
