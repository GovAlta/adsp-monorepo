import React, { useEffect } from 'react';
import { Route, Routes } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { FormEditorCommonMain } from './form-service-common-main';
import { FormDefinitionEditor } from './definitions/formDefinitionEditor';
import { SetSession } from './store/session/actions';
import { fetchConfig } from './store/config/actions';

export const Router = ({ session, config }) => {
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(SetSession(session));
  }, []);

  useEffect(() => {
    dispatch(fetchConfig());
  }, []);

  return (
    <div>
      <Routes>
        <Route path="/" element={<FormEditorCommonMain config={config} />} />
        <Route path="/edit/:id" element={<FormDefinitionEditor />} />
      </Routes>
    </div>
  );
};

export default Router;
