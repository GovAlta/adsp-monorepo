import React, { FunctionComponent, useCallback, useEffect, useState } from 'react';
import { EditTemplateContainer, MonacoDiv, EditTemplateActions } from './styled-components';
import { GoAForm, GoAFormItem } from '@abgov/react-components/experimental';
import { GoAButton } from '@abgov/react-components';
import MonacoEditor from '@monaco-editor/react';

export const EditTemplate: FunctionComponent<any> = ({
  mainTitle,
  onSubjectChange,
  subject,
  subjectEditorHintText,
  subjectTitle,
  subjectEditorConfig,
  onBodyChange,
  body,
  bodyTitle,
  bodyEditorConfig,
  bodyEditorHintText,
  actionButtons
}) => {
  return (
    <EditTemplateContainer>
      <div>
        <h3>{mainTitle}</h3>
        <GoAForm>
          <h4>{subjectTitle}</h4>
          <GoAFormItem helpText={subjectEditorHintText}>
            <MonacoDiv>
              <MonacoEditor
                onChange={(value) => {
                  onSubjectChange(value);
                }}
                value={subject}
                {...subjectEditorConfig}
              />
            </MonacoDiv>
          </GoAFormItem>
          <h4>{bodyTitle}</h4>
          <GoAFormItem helpText={bodyEditorHintText}>
            <MonacoDiv>
              <MonacoEditor
                value={body}
                onChange={(value) => {
                  onBodyChange(value);
                }}
                {...bodyEditorConfig}
              />
            </MonacoDiv>
          </GoAFormItem>
          <EditTemplateActions>
            {actionButtons}
          </EditTemplateActions>
        </GoAForm>
      </div>
    </EditTemplateContainer>
  );
};
