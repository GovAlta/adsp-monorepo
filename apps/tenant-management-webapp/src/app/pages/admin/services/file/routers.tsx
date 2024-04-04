import React from 'react';
import { Route, Routes } from 'react-router-dom';
import { File } from './file';
import { FileTypeDefinitionEditor } from './fileTypes/fileTypeDefinitionEditor';

export const FileRouter = () => {
  return (
    <Routes>
      <Route path="/" element={<File />} />
      <Route path="/edit/:id" element={<FileTypeDefinitionEditor />} />
      <Route path="/new" element={<FileTypeDefinitionEditor />} />
    </Routes>
  );
};
