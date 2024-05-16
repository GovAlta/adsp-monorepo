import React from 'react';
import {
  PreviewTemplateContainer,
  PDFTemplateEditorContainer,
  OuterPDFTemplateEditorContainer,
  Modal,
  HideTablet,
} from '../styled-components';
import { ModalContent } from '../../styled-components';
import { TemplateEditor } from './previewEditor/TemplateEditor';
import { TemplateViewer } from './previewEditor/TemplateViewer';
import { PreviewTemplateCore } from './previewEditor/PreviewTemplateCore';
import { useNavigate } from 'react-router-dom';
import { TabletMessage } from '@components/TabletMessage';

export const PdfTemplatesViewer = (): JSX.Element => {
  const navigate = useNavigate();

  const goBack = () => {
    navigate('/admin/services/pdf?templates=true');
  };

  return (
    <Modal data-testid="template-form">
      <ModalContent>
        <OuterPDFTemplateEditorContainer>
          <TabletMessage goBack={goBack} />
          <HideTablet>
            <PDFTemplateEditorContainer>
              <TemplateViewer />

              <PreviewTemplateContainer>
                <PreviewTemplateCore channelTitle="PDF preview" />
              </PreviewTemplateContainer>
            </PDFTemplateEditorContainer>
          </HideTablet>
        </OuterPDFTemplateEditorContainer>
      </ModalContent>
    </Modal>
  );
};
