import React from 'react';
import { useParams } from 'react-router-dom';

const FormPreview = (): JSX.Element => {
  const { formId } = useParams<{ formId: string }>();

  return (
    <div>
      <h1>Form Preview - {formId}</h1>
    </div>
  );
};

export default FormPreview;
