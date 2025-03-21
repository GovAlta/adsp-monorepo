import React from 'react';
import { Route, Routes } from 'react-router-dom';
import { Cache } from './cache';

export const CacheRouter = () => {
  return (
    <Routes>
      <Route path="/" element={<Cache />} />
    </Routes>
  );
};
