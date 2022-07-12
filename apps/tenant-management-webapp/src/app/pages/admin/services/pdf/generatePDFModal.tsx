import React, { FunctionComponent, useState } from 'react';
import Editor from '@monaco-editor/react';
import { GoAButton, GoADropdown, GoADropdownOption } from '@abgov/react-components';
import { GoAForm, GoAFormItem } from '@abgov/react-components/experimental';
import { PdfGenerationPayload } from '@store/pdf/model';
import { useSelector } from 'react-redux';
import { RootState } from '@store/index';
import styled from 'styled-components';
import { GoAElementLoader } from '@abgov/react-components';

interface GeneratePDFModalProps {
  onSave: (definition: PdfGenerationPayload) => void;
}
export const GeneratePDF: FunctionComponent<GeneratePDFModalProps> = ({ onSave }) => {
  const [definition, setDefinition] = useState<PdfGenerationPayload>({
    templateId: null,
    data: { testVariable: 'some data' },
    fileName: null,
  });
  const indicator = useSelector((state: RootState) => {
    return state?.session?.indicator;
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const hasFormErrors = () => {
    return Object.keys(errors).length !== 0;
  };

  const pdfTemplates = useSelector((state: RootState) => {
    return state?.pdf?.pdfTemplates;
  });

  return (
    <>
      <h1 data-testid="definition-form-title">Generate PDF</h1>
      <GoAForm>
        <GoAFormItem error={errors?.['namespace']}>
          <label>Select a PDF Template</label>
          <GoADropdown
            name="subscriberRoles"
            selectedValues={[definition?.templateId]}
            multiSelect={false}
            onChange={(name, values) => {
              setDefinition({
                ...definition,
                templateId: values[0],
                fileName: `${values[0]}_${new Date().toJSON().slice(0, 19).replace(/:/g, '-')}.pdf`,
              });
            }}
          >
            {Object.keys(pdfTemplates).map((item) => {
              const pdfTemplate = pdfTemplates[item];
              return (
                <GoADropdownOption
                  label={pdfTemplate.name}
                  value={pdfTemplate.id}
                  key={pdfTemplate.id}
                  data-testid={pdfTemplate.id}
                />
              );
            })}
          </GoADropdown>
        </GoAFormItem>
        <GoAFormItem>
          <label>Payload schema</label>
          <EditorStyles>
            <Editor
              data-testid="form-schema"
              height={200}
              value={JSON.stringify(definition?.data, null, 2)}
              onChange={(value) => setDefinition({ ...definition, data: JSON.parse(value) })}
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
            disabled={!definition?.templateId || indicator.show}
            buttonType="primary"
            data-testid="form-save"
            type="submit"
            onClick={(e) => {
              // if no errors in the form then save the definition
              if (!hasFormErrors()) {
                onSave(definition);
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
          buttonType="secondary"
          type="button"
          onClick={() => {
            setDefinition({ templateId: null, data: { testVariable: 'some data' }, fileName: null });
            setErrors({});
          }}
        >
          Reset PDF
        </GoAButton>
      </FlexRow>
    </>
  );
};

const EditorStyles = styled.div`
  border: 1px solid #666;
  border-radius: 3px;
`;

const SpinnerPadding = styled.div`
  margin: 0 0 0 5px;
  float: right;
`;

const SpinnerSpace = styled.div`
  margin: 10px 9px 10px 14px;
  float: right;
`;

const GenerateButtonPadding = styled.div`
  margin: 0 0 0 14px;
`;

const PaddingRight = styled.div`
  margin-right: 12px;
`;

const FlexRow = styled.div`
  display: flex;
  flex-direction: row;
`;
