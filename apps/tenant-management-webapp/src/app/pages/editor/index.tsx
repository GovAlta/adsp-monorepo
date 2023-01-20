import React from 'react';
import styled from 'styled-components';

import { PdfEditor } from './pdf';

import { Route, Switch } from 'react-router-dom';

export const EditorLayoutManager = (): JSX.Element => {
  return (
    <EditorLayout>
      <Switch>
        <Route exact path="/editor/pdf">
          <PdfEditor />
        </Route>
      </Switch>
    </EditorLayout>
  );
};
const EditorLayout = styled.div`
  display: flex;
`;
