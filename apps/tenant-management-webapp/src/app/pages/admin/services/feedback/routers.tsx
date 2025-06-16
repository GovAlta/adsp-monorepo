import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { FeedbackResults } from './feedback/feedbackResults';
import { FeedbackTabs } from './feedbackTabs';

export const Feedback = () => {
  return (
    <Routes>
      <Route path="/" element={<FeedbackTabs />} />
      <Route path="results" element={<FeedbackResults />} />
    </Routes>
  );
};
