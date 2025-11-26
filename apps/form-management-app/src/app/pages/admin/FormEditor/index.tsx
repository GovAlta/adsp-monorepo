import React from 'react';
import { useParams } from 'react-router-dom';

const FormEditor = (): JSX.Element => {
  const { formId } = useParams<{ formId: string }>();

  return (
    <div>
      <h1>Form Editor - {formId}</h1>
    </div>
  );
};

export default FormEditor;
