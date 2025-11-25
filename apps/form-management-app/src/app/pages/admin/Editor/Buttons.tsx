import React, { useState } from 'react';
import styled from 'styled-components';
import { Tab, Tabs } from '../../../components/Tabs';

import { GoAButtonGroup, GoAButton } from '@abgov/react-components';
import { SaveFormModal } from '../../../components/saveModal';
import {
  NameDescriptionDataSchema,
  EditorPadding,
  FormEditorTitle,
  FormEditor,
  FormPreviewContainer,
  FinalButtonPadding,
} from './styled-components';
import type * as monacoNS from 'monaco-editor';
import { useValidators } from '../../../components/useValidators';
import { badCharsCheck, isNotEmptyCheck, wordMaxLengthCheck } from '../../../components/checkInput';
import { editor } from 'monaco-editor';
import { FormDefinition } from '../../../state/form.slice';

type IEditor = monacoNS.editor.IStandaloneCodeEditor;

export interface EditorProps {
  definition: FormDefinition;
 
  editorErrors: {
    uiSchema: string | null;
    dataSchemaJSON: string | null;
    dataSchemaJSONSchema: string | null;
  };
  updateFormDefinition: (definition: FormDefinition) => void;
  activeIndex: number;
  getCurrentEditorRef: () => any;
  foldAll: (editor: IEditor) => void;
  unfoldAll: (editor: IEditor) => void;
  isFormUpdated: boolean;
  validators: any;
  indicator: any;
}

export const Buttons: React.FC<EditorProps> = ({
  activeIndex,
  editorErrors,
  definition,

  updateFormDefinition,
  getCurrentEditorRef,
  foldAll,
  unfoldAll,
  isFormUpdated,
  validators,
  indicator,
}) => {
  const [saveModal, setSaveModal] = useState({ visible: false });

  return (
    <div>
      <FinalButtonPadding>
        <GoAButtonGroup alignment="start">
          <GoAButton
            type="tertiary"
            testId="collapse-all"
            onClick={() => {
              const editor = getCurrentEditorRef();
              if (editor) foldAll(editor);
            }}
            disabled={activeIndex > 1}
          >
            Collapse all
          </GoAButton>
          <GoAButton
            testId="expand-all"
            type="tertiary"
            disabled={activeIndex > 1}
            onClick={() => {
              const editor = getCurrentEditorRef();
              if (editor) unfoldAll(editor);
            }}
          >
            Expand all
          </GoAButton>
        </GoAButtonGroup>

        <GoAButtonGroup alignment="end">
          <GoAButton
            type="primary"
            testId="definition-form-save"
            disabled={
              !isFormUpdated ||
              !definition.name ||
              validators.haveErrors() ||
              editorErrors.dataSchemaJSON !== null ||
              editorErrors.dataSchemaJSONSchema !== null ||
              editorErrors.uiSchema !== null
            }
            onClick={() => {
              // if (indicator.show !== true) {
                updateFormDefinition(definition);
              //}
            }}
          >
            Save
          </GoAButton>
          <GoAButton
            testId="form-editor-cancel"
            type="secondary"
            onClick={() => {
              if (isFormUpdated) {
                setSaveModal({ visible: true });
              } else {
                validators.clear();

                close();
              }
            }}
          >
            Back
          </GoAButton>
        </GoAButtonGroup>
      </FinalButtonPadding>
      <SaveFormModal
        open={saveModal.visible}
        onDontSave={() => {
          close();
        }}
        onSave={() => {
          updateFormDefinition(definition);
          setSaveModal({ visible: false });
          close();
        }}
        saveDisable={!isFormUpdated}
        onCancel={() => {
          setSaveModal({ visible: false });
        }}
      />
    
    </div>
  );
};

const Main = styled.div`
  flex: 1 1 auto;
  padding: var(--goa-space-l, 24px) 0;
`;

const AdminLayout = styled.div`
  display: flex;
`;
