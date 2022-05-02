import React, { FunctionComponent, useEffect, useState } from 'react';
import { AddEditPdfTemplate } from './AddEditPdfTemplates';
import { GoAButton } from '@abgov/react-components';

interface PdfTemplatesProps {
  openAddTemplate: boolean;
}
export const PdfTemplates: FunctionComponent<PdfTemplatesProps> = ({ openAddTemplate }) => {
  const [openAddPdfTemplate, setOpenAddPdfTemplate] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const reset = () => {
    setIsEdit(false);
    setOpenAddPdfTemplate(false);
  };
  useEffect(() => {
    if (openAddTemplate) {
      setOpenAddPdfTemplate(true);
    }
  }, [openAddTemplate]);
  return (
    <>
      <div>
        <br />
        <GoAButton
          data-testid="add-template"
          onClick={() => {
            setOpenAddPdfTemplate(true);
          }}
        >
          Add template
        </GoAButton>
        {(isEdit || openAddPdfTemplate) && (
          <AddEditPdfTemplate
            open={openAddPdfTemplate}
            // onClose={reset}
            isEdit={isEdit}
            onClose={reset}
            // initialValue={selectedDefinition}
            // onSave={(definition) => {
            //   dispatch(updateConfigurationDefinition(definition, true));
            // }}
          />
        )}
      </div>
    </>
  );
};
