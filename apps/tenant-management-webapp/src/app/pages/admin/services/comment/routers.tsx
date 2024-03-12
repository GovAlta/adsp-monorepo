import React from 'react';
import { Route, Routes } from 'react-router-dom-6';
import { Comment } from './comment';
import { CommentTopicTypesEditor } from './topicTypes/commentTopicTypesEditor';

export const CommentRouter = () => {
  return (
    <Routes>
      <Route path="*" element={<Comment />} />
      <Route path="edit/:id" element={<CommentTopicTypesEditor />} />
      <Route path="/new" element={<CommentTopicTypesEditor />} />
    </Routes>
  );
};
