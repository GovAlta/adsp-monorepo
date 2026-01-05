import React, { useState, useRef, useEffect } from 'react';
import styles from './Editor.module.scss';
import { DataEditorContainer } from './DataEditorContainer';
import { UIEditorContainer } from './UiEditorContainer';
import { useValidators } from './useValidators';
import { badCharsCheck, isNotEmptyCheck, wordMaxLengthCheck } from '../../../utils/checkInput';
import type * as monacoNS from 'monaco-editor';
import { Preview } from './Preview';
import { FormDefinition } from '../../../state/types';
import { SubmitButtonsBar } from './SubmitButtonsBar';
import { GoabTabs, GoabTab } from '@abgov/react-components';
import { RegisterData } from '../../../../../../../libs/jsonforms-components/src';
import { UISchemaElement } from '@jsonforms/core';
import { FileItem, FileMetadata, FileWithMetadata } from '../../../state/file/file.slice';
import { PdfJobList } from '../../../state/pdf/pdf.slice';
import { useMonaco } from '@monaco-editor/react';
import { RoleContainer } from './RoleContainer';
import { AppState } from '../../../state';
import { useSelector } from 'react-redux';
import { ClientElement } from '../../../state/keycloak/selectors';
import { GoabTabsOnChangeDetail } from '@abgov/ui-components-common';
import {
  FormPropertyValueCompletionItemProvider,
  FormDataSchemaElementCompletionItemProvider,
  FormUISchemaElementCompletionItemProvider,
} from '../../../utils/autoComplete/form';
import { LifeCycleContainer } from './LifeCycleContainer';

type IEditor = monacoNS.editor.IStandaloneCodeEditor;

export interface EditorProps {
  definition: FormDefinition;
  setDraftDataSchema: (definition: string) => void;
  setDraftUiSchema: (definition: string) => void;
  isFormUpdated: boolean;
  updateFormDefinition: () => void;
  resolvedDataSchema: Record<string, unknown>;
  fileList: Record<string, FileMetadata[]>;
  uploadFile: (file: FileWithMetadata, propertyId: string) => void;
  downloadFile: (file: FileItem) => void;
  deleteFile: (file: FileItem) => void;
  formServiceApiUrl: string;
  schemaError: string | null;
  uiSchema: UISchemaElement;
  registerData: RegisterData;
  nonAnonymous: string[];
  dataList: string[];
  currentPDF: string;
  pdfFile: FileItem;
  jobList: PdfJobList;
  loading: boolean;
  generatePdf: (inputData: Record<string, string>) => void;
  roles: ClientElement[];
  updateEditorFormDefinition: (update: Partial<FormDefinition>) => void;
  fetchKeycloakServiceRoles: () => void;
  queueTasks: any;
  setIntakePeriodModal: (value: boolean) => void;
  intakePeriodModal: boolean;
  selectedCoreEvent: any;
}

export const Editor: React.FC<EditorProps> = ({
  definition,
  setDraftDataSchema,
  setDraftUiSchema,
  updateFormDefinition,
  isFormUpdated,
  resolvedDataSchema,
  fileList,
  uploadFile,
  downloadFile,
  deleteFile,
  formServiceApiUrl,
  schemaError,
  uiSchema,
  registerData,
  nonAnonymous,
  dataList,
  currentPDF,
  pdfFile,
  jobList,
  generatePdf,
  loading,
  roles,
  updateEditorFormDefinition,
  fetchKeycloakServiceRoles,
  queueTasks,
  setIntakePeriodModal,
  intakePeriodModal,
  selectedCoreEvent,
}) => {
  const { errors, validators } = useValidators(
    'name',
    'name',
    badCharsCheck,
    wordMaxLengthCheck(32, 'Name'),
    isNotEmptyCheck('name')
  )
    .add('description', 'description', wordMaxLengthCheck(180, 'Description'))
    .build();

  const editorRefData = useRef<monacoNS.editor.IStandaloneCodeEditor | null>(null);
  const editorRefUi = useRef<monacoNS.editor.IStandaloneCodeEditor | null>(null);

  const [editorErrors, setEditorErrors] = useState<{
    uiSchema: string | null;
    dataSchemaJSON: string | null;
    dataSchemaJSONSchema: string | null;
  }>({
    uiSchema: null,
    dataSchemaJSON: null,
    dataSchemaJSONSchema: null,
  });

  function foldAll(editor: IEditor) {
    editor.trigger('folding-util', 'editor.foldAll', undefined);
  }
  function unfoldAll(editor: IEditor) {
    editor.trigger('folding-util', 'editor.unfoldAll', undefined);
  }

  const [rolesTabLoaded, setRolesTabLoaded] = useState(false);

  const [activeTab, setActiveTab] = useState(1);

  useEffect(() => {
    if (activeTab === 3) setRolesTabLoaded(true);
  }, [activeTab]);

  const [dataEditorLocation, setDataEditorLocation] = useState<number>(0);
  const [uiEditorLocation, setUiEditorLocation] = useState<number>(0);

  const getCurrentEditorRef = () => {
    if (activeTab === 1) return editorRefData.current; // Data schema tab
    if (activeTab === 2) return editorRefUi.current; // UI schema tab
    return null;
  };

  const handleEditorDidMountData = (editor: monacoNS.editor.IStandaloneCodeEditor) => {
    editorRefData.current = editor;

    requestAnimationFrame(() => {
      setTimeout(() => {
        editor.setScrollTop(dataEditorLocation);
      }, 5);
    });
    editor.onDidScrollChange((e: monacoNS.IScrollEvent) => {
      setDataEditorLocation(e.scrollTop);
    });
  };

  const handleEditorDidMountUi = (editor: monacoNS.editor.IStandaloneCodeEditor) => {
    editorRefUi.current = editor;

    requestAnimationFrame(() => {
      setTimeout(() => {
        editor.setScrollTop(uiEditorLocation);
      }, 5);
    });

    editor.onDidScrollChange((e: monacoNS.IScrollEvent) => {
      setUiEditorLocation(e.scrollTop);
    });
  };

  const monaco = useMonaco();

  // Resolved data schema (with refs inlined) is used to generate suggestions.
  useEffect(() => {
    if (monaco) {
      const valueProvider = monaco.languages.registerCompletionItemProvider(
        'json',
        new FormPropertyValueCompletionItemProvider(definition?.dataSchema as unknown as Record<string, unknown>)
      );

      const uiElementProvider = monaco.languages.registerCompletionItemProvider(
        'json',
        new FormUISchemaElementCompletionItemProvider(definition?.dataSchema as unknown as Record<string, unknown>)
      );

      const dataElementProvider = monaco.languages.registerCompletionItemProvider(
        'json',
        new FormDataSchemaElementCompletionItemProvider()
      );

      return function () {
        valueProvider.dispose();
        uiElementProvider.dispose();
        dataElementProvider.dispose();
      };
    }
  }, [monaco, definition]);

  const { isLoadingRoles } = useSelector((state: AppState) => ({
    isLoadingRoles: state.keycloak.loadingRealmRoles || state.keycloak.loadingKeycloakRoles,
  }));

  return (
    <div className={styles['form-editor']}>
      <div className={styles['name-description-data-schema']}>
        <GoabTabs
          onChange={(event: GoabTabsOnChangeDetail) => {
            !!event && setActiveTab(event.tab);
          }}
          data-testid="form-editor-tabs"
        >
          <GoabTab heading="Data schema" data-testid="dcm-form-editor-data-schema-tab">
            <DataEditorContainer
              errors={errors}
              editorErrors={editorErrors}
              tempDataSchema={definition?.dataSchema}
              setDraftDataSchema={setDraftDataSchema}
              setEditorErrors={setEditorErrors}
              handleEditorDidMountData={handleEditorDidMountData}
            />
          </GoabTab>
          <GoabTab heading="UI schema" data-testid="dcm-form-editor-ui-schema-tab">
            <UIEditorContainer
              errors={errors}
              editorErrors={editorErrors}
              tempUiSchema={definition?.uiSchema}
              setDraftUiSchema={setDraftUiSchema}
              setEditorErrors={setEditorErrors}
              handleEditorDidMountUi={handleEditorDidMountUi}
            />
          </GoabTab>
          <GoabTab heading="Roles" data-testid="dcm-form-editor-ui-schema-tab">
            {rolesTabLoaded && (
              <div>
                <RoleContainer
                  definition={definition}
                  roles={roles}
                  updateEditorFormDefinition={updateEditorFormDefinition}
                  fetchKeycloakServiceRoles={fetchKeycloakServiceRoles}
                />
                {isLoadingRoles && <div className={styles.textLoadingIndicator}>Loading roles from access service</div>}
              </div>
            )}
          </GoabTab>
          <GoabTab heading="Lifecycle" data-testid="dcm-form-editor-ui-schema-tab">
            <LifeCycleContainer
              definition={definition}
              errors={errors}
              updateEditorFormDefinition={updateEditorFormDefinition}
              queueTasks={queueTasks}
              setIntakePeriodModal={setIntakePeriodModal}
              intakePeriodModal={intakePeriodModal}
              selectedCoreEvent={selectedCoreEvent}
            />
          </GoabTab>
        </GoabTabs>
        <SubmitButtonsBar
          getCurrentEditorRef={getCurrentEditorRef}
          activeIndex={activeTab - 1}
          editorErrors={editorErrors}
          definition={definition}
          updateFormDefinition={updateFormDefinition}
          foldAll={foldAll}
          unfoldAll={unfoldAll}
          isFormUpdated={isFormUpdated}
          validators={validators}
        />
      </div>
      <div className={styles['preview-pane']}>
        <Preview
          fileList={fileList}
          uploadFile={uploadFile}
          downloadFile={downloadFile}
          deleteFile={deleteFile}
          formServiceApiUrl={formServiceApiUrl}
          schemaError={schemaError}
          dataSchema={resolvedDataSchema}
          uiSchema={uiSchema}
          registerData={registerData}
          nonAnonymous={nonAnonymous}
          dataList={dataList}
          currentPDF={currentPDF}
          pdfFile={pdfFile}
          jobList={jobList}
          generatePdf={generatePdf}
          loading={loading}
        />
      </div>
    </div>
  );
};
