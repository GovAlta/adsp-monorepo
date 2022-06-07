import React, { FunctionComponent, useEffect, useState } from 'react';
import Editor from '@monaco-editor/react';
import { GoAButton, GoADropdown, GoADropdownOption } from '@abgov/react-components';
import { GoAModal, GoAModalActions, GoAModalContent, GoAModalTitle } from '@abgov/react-components/experimental';
import { GoAForm, GoAFormItem } from '@abgov/react-components/experimental';
import { PdfGenerationPayload } from '@store/pdf/model';
import { useSelector } from 'react-redux';
import { RootState } from '@store/index';

interface GeneratePDFModalProps {
  onSave: (definition: PdfGenerationPayload) => void;
  open: boolean;
  onClose: () => void;
}
export const GeneratePDFModal: FunctionComponent<GeneratePDFModalProps> = ({ onSave, onClose, open }) => {
  const [definition, setDefinition] = useState<PdfGenerationPayload>({ templateId: null, data: {}, fileName: null });
  const [selectedPDF, setSelectedPDF] = useState<string>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const hasFormErrors = () => {
    return Object.keys(errors).length !== 0;
  };

  const pdfTemplates = useSelector((state: RootState) => {
    return state?.pdf?.pdfTemplates;
  });

  console.log(JSON.stringify(definition) + '<definitiondefinition');

  useEffect(() => {
    console.log(JSON.stringify(selectedPDF) + '<selectedPDFselectedPDF');
    if (selectedPDF) {
      setDefinition({ ...definition, templateId: selectedPDF, fileName: `${selectedPDF}_${Date.now()}.pdf` });
    }
    console.log(JSON.stringify(definition) + '<definition');
  }, [selectedPDF]);
  return (
    <>
      <GoAModal testId="definition-form" isOpen={open}>
        <GoAModalTitle testId="definition-form-title">Generate PDF</GoAModalTitle>
        <GoAModalContent>
          <GoAForm>
            <GoAFormItem error={errors?.['namespace']}>
              <label>PDF Template</label>
              <GoADropdown
                name="subscriberRoles"
                selectedValues={[selectedPDF]}
                multiSelect={false}
                onChange={(name, values) => {
                  console.log(JSON.stringify(values) + '<values');
                  setSelectedPDF(values[0]);
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
            </GoAFormItem>
          </GoAForm>
        </GoAModalContent>
        <GoAModalActions>
          <GoAButton
            data-testid="form-cancel"
            buttonType="secondary"
            type="button"
            onClick={() => {
              onClose();
              setErrors({});
            }}
          >
            Cancel
          </GoAButton>
          <GoAButton
            disabled={!definition?.templateId}
            buttonType="primary"
            data-testid="form-save"
            type="submit"
            onClick={(e) => {
              // if no errors in the form then save the definition
              if (!hasFormErrors()) {
                onSave(definition);
                setDefinition(null);
                onClose();
              } else {
                return;
              }
            }}
          >
            Save
          </GoAButton>
        </GoAModalActions>
      </GoAModal>
    </>
  );
};
