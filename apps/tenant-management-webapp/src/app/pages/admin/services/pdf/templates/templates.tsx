import React, { FunctionComponent, useEffect, useState } from 'react';
import { AddEditPdfTemplate } from './AddEditPdfTemplates';
import { GoAButton } from '@abgov/react-components';
import { useDispatch, useSelector } from 'react-redux';
import { getPdfTemplates, updatePdfTemplate } from '@store/pdf/action';
import { RootState } from '@store/index';
import { renderNoItem } from '@components/NoItem';
import { PdfTemplatesTable } from './templatesList';
import { PageIndicator } from '@components/Indicator';
import { defaultPdfTemplate } from '@store/pdf/model';

interface PdfTemplatesProps {
  openAddTemplate: boolean;
}
export const PdfTemplates: FunctionComponent<PdfTemplatesProps> = ({ openAddTemplate }) => {
  const [openAddPdfTemplate, setOpenAddPdfTemplate] = useState(false);
  const [selectedPdfTemplate, setSelectedPdfTemplate] = useState(defaultPdfTemplate);

  const [isEdit, setIsEdit] = useState(false);
  const indicator = useSelector((state: RootState) => {
    return state?.session?.indicator;
  });
  const pdfTemplates = useSelector((state: RootState) => {
    return state?.pdf?.pdfTemplates;
  });

  const dispatch = useDispatch();

  const reset = () => {
    setIsEdit(false);
    setOpenAddPdfTemplate(false);
  };
  useEffect(() => {
    if (openAddTemplate) {
      setOpenAddPdfTemplate(true);
    }
  }, [openAddTemplate]);
  useEffect(() => {
    dispatch(getPdfTemplates());
  }, []);

  return (
    <>
      <div>
        <br />
        {indicator.show && <PageIndicator />}
        {!indicator.show && (
          <GoAButton
            data-testid="add-template"
            onClick={() => {
              setOpenAddPdfTemplate(true);
            }}
          >
            Add template
          </GoAButton>
        )}
        <br />
        <br />
        {(isEdit || openAddPdfTemplate) && (
          <AddEditPdfTemplate
            open={openAddPdfTemplate}
            templates={pdfTemplates}
            isEdit={isEdit}
            onClose={reset}
            initialValue={selectedPdfTemplate}
            onSave={(definition) => {
              dispatch(updatePdfTemplate(definition));
            }}
          />
        )}
        {!indicator.show && !pdfTemplates && renderNoItem('pdf templates')}
        {!indicator.show && pdfTemplates && <PdfTemplatesTable templates={pdfTemplates} />}
      </div>
    </>
  );
};
