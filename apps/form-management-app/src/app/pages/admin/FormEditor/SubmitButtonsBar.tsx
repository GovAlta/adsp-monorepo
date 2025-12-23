import React, { useState } from 'react';
import styles from './Editor.module.scss';
import { GoabButtonGroup, GoabButton } from '@abgov/react-components';
import { useNavigate, useParams } from 'react-router-dom';
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
  updateFormDefinition: () => void;
  activeIndex: number;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  getCurrentEditorRef: () => any;
  foldAll: (editor: IEditor) => void;
  unfoldAll: (editor: IEditor) => void;
  isFormUpdated: boolean;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  validators: any;
}

export const SubmitButtonsBar: React.FC<EditorProps> = ({
  activeIndex,
  editorErrors,
  definition,
  updateFormDefinition,
  isFormUpdated,
  validators,
}) => {
  const [saveModal, setSaveModal] = useState({ visible: false });
  const navigate = useNavigate();
  const { tenant } = useParams<{ tenant: string }>();

  const close = () => {
    navigate(`/${tenant}/forms`);
  };

  return (
    <div>
      <div className={styles['final-button-padding']}>
        <GoabButtonGroup alignment="end">
          <GoabButton
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
              updateFormDefinition();
            }}
          >
            Save
          </GoabButton>
          <GoabButton
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
          </GoabButton>
        </GoabButtonGroup>
      </div>
      <SaveFormModal
        open={saveModal.visible}
        onDontSave={() => {
          close();
        }}
        onSave={() => {
          updateFormDefinition();
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
