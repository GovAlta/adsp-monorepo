import React, { FunctionComponent, useState } from 'react';
import Editor from '@monaco-editor/react';
import { GoAButton } from '@abgov/react-components-new';
import { GoAForm, GoAFormItem } from '@abgov/react-components/experimental';
import { PdfGenerationPayload, PdfTemplate } from '@store/pdf/model';
import { useSelector } from 'react-redux';
import { RootState } from '@store/index';
import { GoAElementLoader } from '@abgov/react-components';
import {
  EditorStyles,
  FlexRow,
  PaddingRight,
  GenerateButtonPadding,
  SpinnerPadding,
  SpinnerSpace,
} from './styled-components';
interface GeneratePDFModalProps {
  template: PdfTemplate;
  onSave: (definition: PdfGenerationPayload) => void;
}
export const GeneratePDF: FunctionComponent<GeneratePDFModalProps> = ({ template, onSave }) => {
  const initPdfPayload = {
    templateId: template.id,
    data: {},
    fileName: `${template.id}_${new Date().toJSON().slice(0, 19).replace(/:/g, '-')}.pdf`,
  };
  const [pdfPayload, setPdfPayload] = useState<PdfGenerationPayload>(initPdfPayload);

  const indicator = useSelector((state: RootState) => {
    return state?.session?.indicator;
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const hasFormErrors = () => {
    return Object.keys(errors).length !== 0;
  };
  return (
    <>
      <GoAForm>
        <GoAFormItem>
          <EditorStyles>
            <Editor
              data-testid="form-schema"
              height={150}
              value={JSON.stringify(pdfPayload?.data, null, 2)}
              onChange={(value) => setPdfPayload({ ...pdfPayload, data: JSON.parse(value) })}
              language="json"
              options={{
                automaticLayout: true,
                scrollBeyondLastLine: false,
                tabSize: 2,
                minimap: { enabled: false },
              }}
            />
          </EditorStyles>
        </GoAFormItem>
      </GoAForm>

      <FlexRow>
        <PaddingRight>
          <GoAButton
            disabled={!pdfPayload?.templateId || indicator.show}
            type="secondary"
            data-testid="form-save"
            onClick={() => {
              // if no errors in the form then save the definition
              if (!hasFormErrors()) {
                onSave(pdfPayload);
              } else {
                return;
              }
            }}
          >
            <GenerateButtonPadding>
              Generate PDF
              {indicator.show ? (
                <SpinnerPadding>
                  <GoAElementLoader visible={true} size="default" baseColour="#c8eef9" spinnerColour="#0070c4" />
                </SpinnerPadding>
              ) : (
                <SpinnerSpace></SpinnerSpace>
              )}
            </GenerateButtonPadding>
          </GoAButton>
        </PaddingRight>

        <GoAButton
          data-testid="form-cancel"
          type="tertiary"
          onClick={() => {
            setPdfPayload(initPdfPayload);
            setErrors({});
          }}
        >
          Reset PDF
        </GoAButton>
      </FlexRow>
    </>
  );
};
