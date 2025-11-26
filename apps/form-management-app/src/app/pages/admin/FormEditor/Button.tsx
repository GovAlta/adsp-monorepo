import React, { useState } from 'react';
import './Editor.scss';
import { GoAButtonGroup, GoAButton } from '@abgov/react-components';
import { useNavigate } from 'react-router-dom';
import { SaveFormModal } from './saveModal';
import type * as monacoNS from 'monaco-editor';
import { FormDefinition } from '../../../state/types';

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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  getCurrentEditorRef: () => any;
  foldAll: (editor: IEditor) => void;
  unfoldAll: (editor: IEditor) => void;
  isFormUpdated: boolean;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  validators: any;
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
}) => {
  const [saveModal, setSaveModal] = useState({ visible: false });
  const navigate = useNavigate();

  const close = () => {
    navigate('/');
  };

  return (
    <div>
      <div className='final-button-padding'>
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
      </div>
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