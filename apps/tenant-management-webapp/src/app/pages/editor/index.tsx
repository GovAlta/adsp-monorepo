import React, { useContext, useEffect } from 'react';
import styled from 'styled-components';

import { PdfEditor } from './pdf';
import EditorPage from './editor';
import { HeaderCtx } from '@lib/headerContext';
import { Route, Switch } from 'react-router-dom';

export const EditorLayoutManager = (): JSX.Element => {
  const { setTitle } = useContext(HeaderCtx);

  useEffect(() => {
    setTitle('Alberta Digital Service Platform - Tenant management');
  }, [setTitle]);

  return (
    <EditorLayout>
      <Switch>
        <Route exact path="/editor/pdf">
          <PdfEditor />
        </Route>
        <Route exact path="/editor">
          <EditorPage />
        </Route>
      </Switch>
    </EditorLayout>
  );
};
const EditorLayout = styled.div`
  display: flex;
`;
