import React from 'react';
import { Route, Switch } from 'react-router-dom';
import { Pdf } from './pdf';
import { useRouteMatch } from 'react-router';
import { PdfTemplatesEditor } from './templates/pdfTemplateEditor';

export const PDFRouter = () => {
  const { url } = useRouteMatch();
  return (
    <Switch>
      <Route exact path={`${url}/`}>
        <Pdf />
      </Route>
      <Route path={`${url}/edit/:id`} component={PdfTemplatesEditor} />
    </Switch>
  );
};
