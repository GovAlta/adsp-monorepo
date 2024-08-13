import React from 'react';
import { Route, Routes } from 'react-router-dom';
import { Value } from './value';

export const ValueRouter = () => {
  return (
    <Routes>
      <Route path="/" element={<Value />} />
    </Routes>
  );
};
