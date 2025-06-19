import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { FeedbackTabs } from './feedbackTabs';

export const Feedback = () => {
  return (
    <Routes>
      <Route path="/" element={<FeedbackTabs />} />
    </Routes>
  );
};
