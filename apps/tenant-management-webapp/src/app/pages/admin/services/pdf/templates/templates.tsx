import React, { useEffect, useState } from 'react';
import { AddEditPdfTemplate } from './addEditPdfTemplates';
import { GoabButton } from '@abgov/react-components';
import { useDispatch, useSelector } from 'react-redux';
import { getPdfTemplates, updatePdfTemplate, deletePdfTemplate, getCorePdfTemplates } from '@store/pdf/action';
import { RootState } from '@store/index';
import { renderNoItem } from '@components/NoItem';
import { PdfTemplatesTable } from './templatesList';
import { CorePdfTemplatesTable } from './coreTemplatesList';
import { PageIndicator } from '@components/Indicator';
import { defaultPdfTemplate } from '@store/pdf/model';
import { useNavigate } from 'react-router-dom';
import { DeleteModal } from '@components/DeleteModal';

interface PdfTemplatesProps {
  openAddTemplate: boolean;
}
export const PdfTemplates = ({ openAddTemplate }: PdfTemplatesProps) => {
  const [openAddPdfTemplate, setOpenAddPdfTemplate] = useState(false);
  const openEditor = useSelector((state: RootState) => state.pdf.openEditor);

  const navigate = useNavigate();

  const isObjectEmpty = (obj) => {
    return JSON.stringify(obj) === '{}';
  };

  useEffect(() => {
    if (openEditor) {
      navigate(`edit/${openEditor}`);
    }
  }, [openEditor]); // eslint-disable-line react-hooks/exhaustive-deps

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

  const corePdfTemplates = useSelector((state: RootState) => {
    return state?.pdf?.corePdfTemplates;
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
    dispatch(getCorePdfTemplates());
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // eslint-disable-next-line
  useEffect(() => {
    document.body.style.overflow = 'unset';
  }, [pdfTemplates]);

  return (
    <section>
      <GoabButton
        testId="add-template"
        onClick={() => {
          setOpenAddPdfTemplate(true);
        }}
      >
        Add template
      </GoabButton>
      <br />
      <br />
      {indicator.show && <PageIndicator />}

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

      {!indicator.show && corePdfTemplates && (
        <>
          <h3>Core templates</h3>
          <CorePdfTemplatesTable templates={corePdfTemplates} />
        </>
      )}
      {/* Delete confirmation */}
      <DeleteModal
        isOpen={showDeleteConfirmation}
        title="Delete PDF template"
        content={
          <div>
            Are you sure you wish to delete{' '}
            <b>
              {currentTemplate?.name} ID: {currentTemplate?.id}
            </b>
            ?
          </div>
        }
        onCancel={() => setShowDeleteConfirmation(false)}
        onDelete={() => {
          setShowDeleteConfirmation(false);
          dispatch(deletePdfTemplate(currentTemplate));
        }}
      />
    </section>
  );
};
