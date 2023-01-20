import React, { FunctionComponent, useEffect, useState } from 'react';
import { AddEditPdfTemplate } from './AddEditPdfTemplates';
import { GoAButton } from '@abgov/react-components';
import { useDispatch, useSelector } from 'react-redux';
import { getPdfTemplates, updatePdfTemplate, deletePdfTemplate } from '@store/pdf/action';
import { RootState } from '@store/index';
import { renderNoItem } from '@components/NoItem';
import { PdfTemplatesTable } from './templatesList';
import { PageIndicator } from '@components/Indicator';
import { defaultPdfTemplate } from '@store/pdf/model';

import { DeleteModal } from '@components/DeleteModal';
import { useHistory } from 'react-router-dom';

interface PdfTemplatesProps {
  openAddTemplate: boolean;
}
export const PdfTemplates: FunctionComponent<PdfTemplatesProps> = ({ openAddTemplate }) => {
  const [openAddPdfTemplate, setOpenAddPdfTemplate] = useState(false);

  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const pdfTemplates = useSelector((state: RootState) => {
    return Object.entries(state?.pdf?.pdfTemplates)
      .sort((template1, template2) => {
        return template1[1].name.localeCompare(template2[1].name);
      })
      .reduce((tempObj, [pdfTemplateId, pdfTemplateData]) => {
        tempObj[pdfTemplateId] = pdfTemplateData;
        return tempObj;
      }, {});
  });

  const [currentTemplate, setCurrentTemplate] = useState(defaultPdfTemplate);

  const [isEdit, setIsEdit] = useState(false);

  const indicator = useSelector((state: RootState) => {
    return state?.session?.indicator;
  });

  const dispatch = useDispatch();
  const history = useHistory();
  const reset = () => {
    setIsEdit(false);
    setOpenAddPdfTemplate(false);
    setCurrentTemplate(defaultPdfTemplate);
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
        <GoAButton
          data-testid="add-template"
          onClick={() => {
            setOpenAddPdfTemplate(true);
          }}
        >
          Add template
        </GoAButton>
        <br />
        <br />
        <PageIndicator />
        {(isEdit || openAddPdfTemplate) && (
          <AddEditPdfTemplate
            open={openAddPdfTemplate}
            isEdit={isEdit}
            onClose={reset}
            initialValue={defaultPdfTemplate}
            onSave={(definition) => {
              dispatch(updatePdfTemplate(definition));
            }}
          />
        )}
        {!indicator.show && !pdfTemplates && renderNoItem('pdf templates')}
        {!indicator.show && pdfTemplates && (
          <PdfTemplatesTable
            templates={pdfTemplates}
            edit={(currentTemplate) => {
              setCurrentTemplate(currentTemplate);

              history.push({
                pathname: '/editor/pdf',
                state: { currentTemplate },
              });
            }}
            onDelete={(currentTemplate) => {
              setShowDeleteConfirmation(true);
              setCurrentTemplate(currentTemplate);
            }}
          />
        )}
        {/* Delete confirmation */}
        {showDeleteConfirmation && (
          <DeleteModal
            isOpen={showDeleteConfirmation}
            title="Delete PDF template"
            content={`Delete ${currentTemplate?.name} (ID: ${currentTemplate?.id})?`}
            onCancel={() => setShowDeleteConfirmation(false)}
            onDelete={() => {
              setShowDeleteConfirmation(false);
              dispatch(deletePdfTemplate(currentTemplate));
            }}
          />
        )}
      </div>
    </>
  );
};
