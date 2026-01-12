import React, { useEffect, useRef, useState } from 'react';
import { PdfTemplate } from '@store/pdf/model';

import { GoabIconButton } from '@abgov/react-components';

import { Anchor, Edit, PdfConfigFormWrapper, Tooltip } from '../../styled-components';
import { AddEditPdfTemplate } from '../addEditPdfTemplates';
import { useDispatch } from 'react-redux';
import { updatePdfTemplate } from '@store/pdf/action';

interface PDFConfigFormProps {
  template: PdfTemplate;
  isEdit?: boolean;
}
export const PDFConfigForm = ({ template, isEdit = true }: PDFConfigFormProps) => {
  const { id, name, description } = template;
  const [openEditPdfTemplate, setOpenEditPdfTemplate] = useState(false);
  const dispatch = useDispatch();
  const [isElipsisActive, setIsElipsisActive] = useState(false);
  const tooltipElem = useRef<HTMLParagraphElement>();
  const [isNameElipsisActive, setIsNameElipsisActive] = useState(false);
  const tooltipNameElem = useRef<HTMLParagraphElement>();
  const [isDescElipsisActive, setIsDescElipsisActive] = useState(false);
  const tooltipDescElem = useRef<HTMLParagraphElement>();
  useEffect(() => {
    const elem = tooltipNameElem.current;

    setIsNameElipsisActive(elem ? elem.offsetWidth < elem.scrollWidth || elem.offsetHeight < elem.scrollHeight : false);
  }, []);
  useEffect(() => {
    const elem = tooltipElem.current;

    setIsElipsisActive(elem ? elem.offsetWidth < elem.scrollWidth || elem.offsetHeight < elem.scrollHeight : false);
  }, []);
  useEffect(() => {
    const elem = tooltipDescElem.current;

    setIsDescElipsisActive(elem ? elem.offsetWidth < elem.scrollWidth || elem.offsetHeight < elem.scrollHeight : false);
  }, []);
  return (
    <PdfConfigFormWrapper data-testid="pdf-config-form">
      <div className="nameColumn">
        <table>
          <thead>
            <tr>
              <th>Name</th>
            </tr>
            <tr>
              <td data-testid="template-name">
                <Tooltip>
                  <div className="overflowContainer" ref={tooltipNameElem}>
                    {name}
                  </div>
                  {isNameElipsisActive && <p>{name}</p>}
                </Tooltip>
              </td>
            </tr>
          </thead>
        </table>
      </div>
      <div className="separator"></div>
      <div className="idColumn">
        <table>
          <thead>
            <tr>
              <th>Template ID</th>
            </tr>
            <tr>
              <td data-testid="template-id">
                <Tooltip>
                  <div className="overflowContainer" ref={tooltipElem}>
                    {id}
                  </div>
                  {isElipsisActive && <p>{id}</p>}
                </Tooltip>
              </td>
            </tr>
          </thead>
        </table>
      </div>
      <div className="separator"></div>
      <div className="descColumn">
        <table>
          <thead>
            <tr>
              <th>Description</th>
            </tr>
            <tr>
              <td data-testid="template-description">
                <Tooltip>
                  <div className="overflowContainer" ref={tooltipDescElem}>
                    {description}
                  </div>
                  {isDescElipsisActive && <p>{description}</p>}
                </Tooltip>
              </td>
            </tr>
          </thead>
        </table>
      </div>
      {isEdit && (
        <div className="editColumn">
          <Edit>
            <Anchor rel="noopener noreferrer" onClick={() => setOpenEditPdfTemplate(true)}>
              Edit
            </Anchor>
            <GoabIconButton
              icon="create"
              testId="pdf-template-information-edit-icon"
              title="Edit"
              size="small"
              onClick={() => setOpenEditPdfTemplate(true)}
            />
          </Edit>
        </div>
      )}
      {openEditPdfTemplate && (
        <AddEditPdfTemplate
          open={openEditPdfTemplate}
          isEdit={true}
          onClose={() => setOpenEditPdfTemplate(false)}
          initialValue={template}
          onSave={(template) => {
            dispatch(updatePdfTemplate(template));
          }}
        />
      )}
    </PdfConfigFormWrapper>
  );
};
