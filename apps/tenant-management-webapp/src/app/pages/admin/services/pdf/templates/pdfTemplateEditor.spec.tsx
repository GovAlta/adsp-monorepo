import React from 'react';
import { fireEvent, render } from '@testing-library/react';
import '@testing-library/jest-dom';
import { PdfTemplatesEditor } from './pdfTemplateEditor';

jest.mock('react-router-dom', () => ({ useNavigate: () => jest.fn() }));
jest.mock('./previewEditor/TemplateEditor', () => ({
  TemplateEditor: ({ previewVisible, onTogglePreview }: { previewVisible: boolean; onTogglePreview: () => void }) => (
    <button type="button" onClick={onTogglePreview}>
      {previewVisible ? 'Hide preview' : 'Show preview'}
    </button>
  ),
}));
jest.mock('./previewEditor/PreviewTemplate', () => ({
  PreviewTemplate: () => <div>PDF preview</div>,
}));
jest.mock('@components/FullScreenEditor', () => ({
  FullScreenEditor: ({
    editor,
    previewHidden,
    resizable,
  }: {
    editor: React.ReactNode;
    previewHidden?: boolean;
    resizable?: boolean;
  }) => (
    <div data-testid="full-screen-editor" data-preview-hidden={previewHidden} data-resizable={resizable}>
      {editor}
    </div>
  ),
}));

describe('PdfTemplatesEditor', () => {
  it('enables resizing between the template editor and PDF preview', () => {
    // Arrange
    const { getByTestId } = render(<PdfTemplatesEditor />);

    // Act
    const editor = getByTestId('full-screen-editor');

    // Assert
    expect(editor).toHaveAttribute('data-resizable', 'true');
  });

  it('hides the PDF preview from the template editor control', () => {
    // Arrange
    const { getByTestId, getByRole } = render(<PdfTemplatesEditor />);

    // Act
    fireEvent.click(getByRole('button', { name: 'Hide preview' }));

    // Assert
    expect(getByTestId('full-screen-editor')).toHaveAttribute('data-preview-hidden', 'true');
  });

  it('shows the PDF preview after it has been hidden', () => {
    // Arrange
    const { getByTestId, getByRole } = render(<PdfTemplatesEditor />);
    fireEvent.click(getByRole('button', { name: 'Hide preview' }));

    // Act
    fireEvent.click(getByRole('button', { name: 'Show preview' }));

    // Assert
    expect(getByTestId('full-screen-editor')).toHaveAttribute('data-preview-hidden', 'false');
  });
});
