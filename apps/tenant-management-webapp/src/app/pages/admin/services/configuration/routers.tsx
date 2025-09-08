import React from 'react';
import { Route, Routes } from 'react-router-dom';

import { ConfigurationEditorWrapper } from './editor/ConfigurationEditorWrapper';
import { Configuration } from './configuration';

export const ConfigurationRouter = () => {
  return (
    <Routes>
      <Route index element={<Configuration />} />
      <Route path="/edit/:id" element={<ConfigurationEditorWrapper />} />
    </Routes>
  );
};
