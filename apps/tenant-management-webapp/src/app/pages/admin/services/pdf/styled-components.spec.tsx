import React from 'react';
import { render } from '@testing-library/react';
import '@testing-library/jest-dom';
import { PDFTitle, PdfEditorHeader, TemplateEditorContainerPdf } from './styled-components';

describe('TemplateEditorContainerPdf', () => {
  it('fills the available editor pane width', () => {
    // Arrange
    const { getByTestId } = render(<TemplateEditorContainerPdf data-testid="pdf-template-editor" />);

    // Act
    const editor = getByTestId('pdf-template-editor');

    // Assert
    expect(editor).toHaveStyle('width: 100%');
  });

  it('aligns the preview toggle to the right of the editor title', () => {
    // Arrange
    const { getByTestId } = render(
      <PdfEditorHeader>{React.createElement('goa-button', { 'data-testid': 'preview-toggle' })}</PdfEditorHeader>,
    );

    // Act
    const toggle = getByTestId('preview-toggle');

    // Assert
    expect(toggle).toHaveStyle('margin-left: auto');
  });

  it('keeps the editor title anchored when the preview control changes', () => {
    // Arrange
    const { getByTestId } = render(
      <PdfEditorHeader>
        <PDFTitle data-testid="pdf-editor-title">PDF / Template Editor</PDFTitle>
      </PdfEditorHeader>,
    );

    // Act
    const title = getByTestId('pdf-editor-title');

    // Assert
    expect(title).toHaveStyle('flex: 0 0 auto');
  });

  it('adds space below the preview toggle', () => {
    // Arrange
    const { getByTestId } = render(
      <PdfEditorHeader>{React.createElement('goa-button', { 'data-testid': 'preview-toggle' })}</PdfEditorHeader>,
    );

    // Act
    const toggle = getByTestId('preview-toggle');

    // Assert
    expect(toggle).toHaveStyle('margin-bottom: 10px');
  });
});
