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
import { PreviewTemplate } from './previewEditor/PreviewTemplate';
import { useNavigate } from 'react-router-dom-6';
import { TabletMessage } from '@components/TabletMessage';

export const PdfTemplatesEditor = (): JSX.Element => {
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
                <TemplateEditor />

                <PreviewTemplateContainer>
                  <PreviewTemplate channelTitle="PDF preview" />
                </PreviewTemplateContainer>
              </PDFTemplateEditorContainer>
            </HideTablet>
          </OuterPDFTemplateEditorContainer>
        </ModalContent>
      </Modal>
  );
};
