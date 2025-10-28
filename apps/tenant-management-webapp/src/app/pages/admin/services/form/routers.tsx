import React from 'react';
import { Route, Routes } from 'react-router-dom';
import { Form } from './form';
import { FormDefinitionEditor } from '@form-editor-common';

export const FormRouter = () => {
  return (
    <Routes>
      <Route path="/" element={<Form />} />
      <Route path="/edit/:id" element={<FormDefinitionEditor />} />
    </Routes>
  );
};
