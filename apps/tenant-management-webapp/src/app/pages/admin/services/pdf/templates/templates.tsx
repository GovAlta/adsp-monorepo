import React, { useEffect, useState } from 'react';
import { AddEditPdfTemplate } from './addEditPdfTemplates';
import { GoAButton } from '@abgov/react-components-new';
import { useDispatch, useSelector } from 'react-redux';
import { getPdfTemplates, updatePdfTemplate, deletePdfTemplate } from '@store/pdf/action';
import { RootState } from '@store/index';
import { renderNoItem } from '@components/NoItem';
import { PdfTemplatesTable } from './templatesList';
import { PageIndicator } from '@components/Indicator';
import { defaultPdfTemplate } from '@store/pdf/model';
import { useHistory } from 'react-router-dom';
import { useRouteMatch } from 'react-router';

import { DeleteModal } from '@components/DeleteModal';

interface PdfTemplatesProps {
  openAddTemplate: boolean;
}
export const PdfTemplates = ({ openAddTemplate }: PdfTemplatesProps) => {
  const [openAddPdfTemplate, setOpenAddPdfTemplate] = useState(false);
  const openEditor = useSelector((state: RootState) => state.pdf.openEditor);
  const history = useHistory();
  const { url } = useRouteMatch();

  useEffect(() => {
    if (openEditor) {
      history.push({ pathname: `${url}/edit/${openEditor}` });
    }
  }, [openEditor]);

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

  const indicator = useSelector((state: RootState) => {
    return state?.session?.indicator;
  });

  const dispatch = useDispatch();

  const reset = () => {
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

  // eslint-disable-next-line
  useEffect(() => {}, [pdfTemplates]);

  return (
    <>
      <div>
        <br />
        <GoAButton
          testId="add-template"
          onClick={() => {
            setOpenAddPdfTemplate(true);
          }}
        >
          Add template
        </GoAButton>
        <br />
        <br />
        <PageIndicator />

        <AddEditPdfTemplate
          open={openAddPdfTemplate}
          isEdit={false}
          onClose={reset}
          initialValue={defaultPdfTemplate}
          onSave={(template) => {
            dispatch(updatePdfTemplate(template));
          }}
        />

        {!indicator.show && !pdfTemplates && renderNoItem('pdf templates')}
        {!indicator.show && pdfTemplates && (
          <PdfTemplatesTable
            templates={pdfTemplates}
            onDelete={(currentTemplate) => {
              setShowDeleteConfirmation(true);
              setCurrentTemplate(currentTemplate);
            }}
          />
        )}
        {/* Delete confirmation */}
        <DeleteModal
          isOpen={showDeleteConfirmation}
          title="Delete PDF template"
          content={
            <div>
              Delete <b>{`${currentTemplate?.name} (ID: ${currentTemplate?.id})?`}</b>
            </div>
          }
          onCancel={() => setShowDeleteConfirmation(false)}
          onDelete={() => {
            setShowDeleteConfirmation(false);
            dispatch(deletePdfTemplate(currentTemplate));
          }}
        />
      </div>
    </>
  );
};
