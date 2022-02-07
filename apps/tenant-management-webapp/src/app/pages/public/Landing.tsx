import React, { useState } from 'react';
import styled from 'styled-components';
import { GoAForm, GoAFormItem } from '@abgov/react-components/experimental';
import MonacoEditor from '@monaco-editor/react';
import DOMPurify from 'dompurify';

const LandingPage = (): JSX.Element => {
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');

  const eventTemplateEditHintText =
    "*GOA default header and footer wrapper is applied if the template doesn't include proper <html> opening and closing tags";

  return (
    <NotificationTemplateContainer>
      <EditTemplateContainer>
        <Edit>
          <h3>Edit an email template</h3>
          <GoAForm>
            <h4>Subject</h4>
            <GoAFormItem>
              <MonacoDiv>
                <MonacoEditor
                  data-testid="templateForm-subject"
                  height={50}
                  width="80vh"
                  language="handlebars"
                  value={subject}
                  onChange={(value) => setSubject(value)}
                  options={{
                    wordWrap: 'off',
                    lineNumbers: 'off',
                    scrollbar: { horizontal: 'hidden', vertical: 'hidden' },
                    find: {
                      addExtraSpaceOnTop: false,
                      autoFindInSelection: 'never',
                      seedSearchStringFromSelection: false,
                      overviewRulerBorder: false,
                    },
                    minimap: { enabled: false },
                    renderLineHighlight: 'none',
                    overviewRulerLanes: 0,
                    hideCursorInOverviewRuler: true,
                    overviewRulerBorder: false,
                  }}
                />
              </MonacoDiv>
            </GoAFormItem>
            <h4>Body</h4>
            <GoAFormItem helpText={eventTemplateEditHintText}>
              <MonacoDiv>
                <MonacoEditor
                  data-testid="templateForm-body"
                  height={200}
                  value={body}
                  onChange={(value) => setBody(value)}
                  language="handlebars"
                  options={{
                    tabSize: 2,
                    lineNumbers: 'off',
                    minimap: { enabled: false },
                    overviewRulerBorder: false,
                    lineHeight: 25,
                    renderLineHighlight: 'none',
                    overviewRulerLanes: 0,
                    hideCursorInOverviewRuler: true,
                  }}
                />
              </MonacoDiv>
            </GoAFormItem>
          </GoAForm>
        </Edit>
      </EditTemplateContainer>
      <PreviewTemplateContainer>
        <Preview>
          <h3>Preview</h3>
          <div
            dangerouslySetInnerHTML={{
              __html: DOMPurify.sanitize(body),
            }}
          ></div>
        </Preview>
      </PreviewTemplateContainer>
    </NotificationTemplateContainer>
  );
};

const NotificationTemplateContainer = styled.div`
  display: flex;
  padding-right: 3rem;
  padding-left: 3rem;
  /* flex-direction: row; */
  width: 100%;
  height: auto;
  overflow: hidden;
  box-sizing: border-box;
`;
const MonacoDiv = styled.div`
  display: flex;
  border: 1px solid var(--color-gray-700);
  border-radius: 3px;
  padding: 0.15rem 0.15rem;
`;

const PreviewTemplateContainer = styled.div`
  width: 50%;
  margin-left: 2rem;
  background-color: #00000075;
`;
const Preview = styled.div`
  padding-top: 4rem;
  padding-left: 2rem;
`;
const Edit = styled.div`
  padding-top: 4rem;
`;
const EditTemplateContainer = styled.div`
  width: 50%;
  margin-right: 3rem;
`;
export default LandingPage;
