import { act, fireEvent, render } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ContextProviderFactory } from '../../Context/index';
import { ControlElement, UISchemaElement } from '@jsonforms/core';
import { GoACells, GoARenderers } from '../../../index';
import { JsonForms } from '@jsonforms/react';
import Ajv from 'ajv';

/**
 * VERY IMPORTANT:  Rendering <JsonForms ... /> does not work unless the following
 * is included.
 */
window.matchMedia = jest.fn().mockImplementation((query) => {
  return {
    matches: true,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  };
});

const ajv = new Ajv({ allErrors: true, verbose: true, validateFormats: false });

const fileUploaderUiSchema: ControlElement = {
  type: 'Control',
  scope: '#/properties/supportingDoc',
  label: 'Uploader',
  options: {},
};
const fileUploaderUiSchemaMultiple: ControlElement = {
  type: 'Control',
  scope: '#/properties/supportingDoc',
  label: 'Uploader',
  options: { variant: 'dragdrop' },
};
const dataSchema = {
  type: 'object',
  properties: {
    supportingDoc: {
      type: 'string',
      format: 'file-urn',
    },
  },
};
const dataSchemaRequired = {
  type: 'object',
  properties: {
    supportingDoc: {
      type: 'string',
      format: 'file-urn',
    },
  },
  required: ['supportingDoc'],
};

const mockUpload = jest.fn();
const mockDownload = jest.fn();
const mockDelete = jest.fn();
const fileList = { supportingDoc: [{ urn: 'urn:1q3e131', filename: 'bob.pdf' }] };
const ContextProvider = ContextProviderFactory();

const getForm = (schema: object, uiSchema: UISchemaElement, data: object = {}) => {
  return (
    <ContextProvider
      fileManagement={{
        fileList: fileList,
        uploadFile: mockUpload,
        downloadFile: mockDownload,
        deleteFile: mockDelete,
      }}
    >
      <JsonForms data={data} schema={schema} uischema={uiSchema} ajv={ajv} renderers={GoARenderers} cells={GoACells} />
    </ContextProvider>
  );
};
beforeEach(() => {
  mockUpload.mockClear();
  mockDownload.mockClear();
  mockDelete.mockClear();
});

describe('FileUploaderControl tests', () => {
  it('can render file upload control', () => {
    const { container } = render(getForm(dataSchema, fileUploaderUiSchema));
    const element = container.querySelector('goa-file-upload-input');
    expect(element).toBeInTheDocument();
  });

  it('can render file upload control has help text', () => {
    const uiSchema = {
      ...fileUploaderUiSchema,
      options: {
        ...fileUploaderUiSchema.options,
        help: 'Help text for file upload',
      },
    };

    const { container } = render(getForm(dataSchema, uiSchema));

    const html = container.innerHTML;
    const hasHelptext = html.includes('Help text for file upload');
    expect(hasHelptext).toBe(true);
  });

  it('can upload a file', async () => {
    jest.useFakeTimers();
    const renderer = render(getForm(dataSchema, fileUploaderUiSchema));
    // This act() wrapper is needed for the jest.runAllTimers() call.
    await act(async () => {
      const uploadBtn = await renderer.container.querySelector('div > :scope goa-file-upload-input');
      expect(uploadBtn).toBeInTheDocument();
      fireEvent(uploadBtn!, new CustomEvent('_selectFile', { detail: {} }));
      await jest.runAllTimers();
      expect(mockUpload).toBeCalledTimes(1);
      const file = await renderer.findByText('bob.pdf');
      expect(file).toBeInTheDocument();
    });
  });
  it('can upload file in multi-file scenario', async () => {
    jest.useFakeTimers();
    const renderer = render(getForm(dataSchemaRequired, fileUploaderUiSchemaMultiple));
    // This act() wrapper is needed for the jest.runAllTimers() call.
    await act(async () => {
      const uploadBtn = await renderer.container.querySelector('div > :scope goa-file-upload-input');
      expect(uploadBtn).toBeInTheDocument();
      fireEvent(uploadBtn!, new CustomEvent('_selectFile', { detail: {} }));
      await jest.runAllTimers();

      const file = await renderer.findByText('bob.pdf');
      expect(file).toBeInTheDocument();
    });
  });

  it('can download a file', () => {
    const { baseElement } = render(getForm(dataSchema, fileUploaderUiSchema));
    const downloadBtn = baseElement.querySelector("goa-icon-button[testId='download-icon']");
    expect(downloadBtn).toBeInTheDocument();
    fireEvent(downloadBtn!, new CustomEvent('_click'));
    expect(mockDownload).toBeCalledTimes(1);
  });

  it('can click download a file if readonly', () => {
    const uiSchema = {
      ...fileUploaderUiSchema,
      options: {
        ...fileUploaderUiSchema.options,
        componentProps: {
          ...fileUploaderUiSchema?.options?.componentProps,
          readOnly: true,
        },
      },
    };
    const { baseElement } = render(getForm(dataSchema, uiSchema));
    const downloadBtn = baseElement.querySelector("goa-icon-button[testId='download-icon']");
    expect(downloadBtn).toBeInTheDocument();
    fireEvent(downloadBtn!, new CustomEvent('_click'));
    expect(mockDownload).toBeCalled();
  });

  it('can delete an uploaded file', () => {
    const { baseElement, ...renderer } = render(getForm(dataSchema, fileUploaderUiSchema));

    const deleteBtn = renderer.container.querySelector('div > :scope goa-icon-button[icon="trash"]');
    expect(deleteBtn).toBeInTheDocument();
    fireEvent(deleteBtn!, new CustomEvent('_click'));

    const modal = baseElement.querySelector("goa-modal[testId='delete-confirmation']");
    expect(modal!.getAttribute('open')).toBe('true');
    const deleteConfirm = baseElement.querySelector("goa-button[testId='delete-confirm']");
    expect(deleteConfirm).toBeInTheDocument();
    fireEvent(deleteConfirm!, new CustomEvent('_click'));
    fireEvent.click(deleteConfirm!);

    expect(mockDelete).toBeCalledTimes(1);
  });

  it('replaces existing file when maximum is 1', async () => {
    jest.useFakeTimers();
    const uiSchema = {
      ...fileUploaderUiSchema,
      options: {
        componentProps: {
          maximum: 1,
        },
      },
    };

    const renderer = render(getForm(dataSchema, uiSchema));
    await act(async () => {
      const input = renderer.container.querySelector('goa-file-upload-input');
      fireEvent(input!, new CustomEvent('_selectFile', { detail: {} }));
      await jest.runAllTimers();
    });

    expect(mockDelete).toHaveBeenCalledTimes(1);
    expect(mockUpload).toHaveBeenCalledTimes(1);
  });

  it('should not upload if uploadTrigger is missing', () => {
    const NoUploadContext = ContextProviderFactory();

    const CustomForm = (
      <NoUploadContext
        fileManagement={{
          fileList: fileList,
          uploadFile: undefined,
          downloadFile: mockDownload,
          deleteFile: mockDelete,
        }}
      >
        <JsonForms
          data={{}}
          schema={dataSchema}
          uischema={fileUploaderUiSchema}
          ajv={ajv}
          renderers={GoARenderers}
          cells={GoACells}
        />
      </NoUploadContext>
    );

    const { container } = render(CustomForm);
    const input = container.querySelector('goa-file-upload-input');
    fireEvent(input!, new CustomEvent('_selectFile', { detail: {} }));

    expect(mockUpload).not.toHaveBeenCalled();
  });

  it('does not render help text when help is not defined', () => {
    const { container } = render(getForm(dataSchema, fileUploaderUiSchema));
    expect(container.innerHTML).not.toContain('Help text');
  });

  it('disables uploader when readonly is true', () => {
    const uiSchema = {
      ...fileUploaderUiSchema,
      options: {
        componentProps: {
          readOnly: true,
        },
      },
    };

    const { container } = render(getForm(dataSchema, uiSchema));
    const input = container.querySelector('goa-file-upload-input');
    expect(input).not.toBeInTheDocument();
  });

  it('disables uploader when in stepper review mode', () => {
    const uiSchema = {
      ...fileUploaderUiSchema,
      options: {},
    };

    const renderer = render(getForm(dataSchema, uiSchema, {}));
    const readonlyBlock = renderer.container.querySelector('goa-icon-button[testId="download-icon"]');
    expect(readonlyBlock).toBeInTheDocument();
  });

  it('shows loading modal when file is being uploaded', async () => {
    jest.useFakeTimers();
    const renderer = render(getForm(dataSchema, fileUploaderUiSchema));

    await act(async () => {
      const input = renderer.container.querySelector('goa-file-upload-input');
      fireEvent(input!, new CustomEvent('_selectFile', { detail: {} }));
      await jest.runAllTimers();
    });

    const modal = renderer.container.querySelector('goa-modal');
    expect(modal).not.toBeNull();
  });
});
