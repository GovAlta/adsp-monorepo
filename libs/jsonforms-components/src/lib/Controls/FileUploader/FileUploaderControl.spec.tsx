import { fireEvent, render } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ContextProvider, JsonFormContext as Context } from '../../Context/index';
import { ControlElement, ControlProps } from '@jsonforms/core';
import { FileUploader, FileUploaderLayoutRendererProps } from './FileUploaderControl';

const fileUploaderUiSchema: ControlElement = {
  type: 'Control',
  scope: '#/properties/supportingDoc',
  label: 'My First name',
};

const staticProps: FileUploaderLayoutRendererProps & ControlProps = {
  uischema: fileUploaderUiSchema,
  schema: {},
  rootSchema: {},
  handleChange: (path, value) => {},
  enabled: true,
  label: 'Supporting Document',
  id: 'supportingDoc',
  config: {},
  i18nKeyPrefix: 'FileUploader',
  path: '',
  errors: '',
  data: 'My file',
  visible: true,
  required: false,
};

const ContextComponent = (props: FileUploaderLayoutRendererProps) => {
  return (
    <ContextProvider
      fileManagement={{
        fileList: { FileUploader: 'urn:1q3e131' },
        uploadFile: jest.fn(),
        downloadFile: jest.fn(),
        deleteFile: jest.fn(),
      }}
    >
      <FileUploader {...props} /> ;
    </ContextProvider>
  );
};

describe('FileUploaderControl tests', () => {
  it('can render fileupload control', () => {
    const props = { ...staticProps };
    const { container } = render(<ContextComponent {...props} />);
    const element = container.querySelector('goa-file-upload-input');
    expect(element).toBeInTheDocument();
  });

  it('can render delete modal in fileupload control with a file', () => {
    const props = { ...staticProps };
    const { container } = render(<ContextComponent {...props} />);
    const element = container.querySelector('goa-modal');
    expect(element).toBeInTheDocument();
  });
});
