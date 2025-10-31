import { GoAButton, GoAButtonGroup, GoACheckbox } from '@abgov/react-components';
import { AgentChat } from '@core-services/app-common';
import MonacoEditor from '@monaco-editor/react';
import { FunctionComponent, useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useParams } from 'react-router-dom';
import { EditorConfigurationForm } from '@components/EditorConfigurationForm';
import { FullScreenEditor } from '@components/FullScreenEditor';
import { PageIndicator } from '@components/Indicator';
import { Tab, Tabs } from '@components/Tabs';
import { ClientRoleTable } from '@components/RoleTable';
import { AppDispatch, RootState } from '@store/index';
import { FetchRealmRoles } from '@store/tenant/actions';
import { fetchKeycloakServiceRoles } from '@store/access/actions';
import { editorSelector, messagesSelector } from '@store/agent/selectors';
import {
  connectAgent,
  disconnectAgent,
  editAgent,
  messageAgent,
  startEditAgent,
  startThread,
  updateAgent,
} from '@store/agent/actions';
import { filteredRoleListSelector } from '@store/sharedSelectors/roles';
import styled from 'styled-components';

const ChatContainerDiv = styled.div`
  flex: 1;
  position: relative;
  overflow: hidden;
`;

export const AgentEditor: FunctionComponent = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [showSelectedRoles, setShowSelectedRoles] = useState(false);

  const indicator = useSelector((state: RootState) => state?.session?.indicator);
  const { agent, hasChanges, threadId } = useSelector(editorSelector);
  const messages = useSelector((state: RootState) => messagesSelector(state, threadId));

  const filteredRoles = useSelector((state: RootState) =>
    filteredRoleListSelector(state, 'agent.editor.agent.userRoles', showSelectedRoles)
  );

  const dispatch = useDispatch<AppDispatch>();
  useEffect(() => {
    dispatch(FetchRealmRoles());
    dispatch(fetchKeycloakServiceRoles());
  }, [dispatch]);

  useEffect(() => {
    dispatch(connectAgent());
    return () => {
      dispatch(disconnectAgent());
    };
  }, [dispatch]);

  useEffect(() => {
    dispatch(startEditAgent(id));
  }, [dispatch, id]);

  useEffect(() => {
    dispatch(startThread(id, threadId));
  }, [dispatch, id, threadId]);

  return (
    <FullScreenEditor
      onGoBack={() => navigate('/admin/services/agent')}
      editor={
        <section>
          {indicator.show && <PageIndicator />}
          <h2>Agent editor</h2>
          <hr />
          <EditorConfigurationForm resource={agent} canEdit={false} onEdit={() => {}} />
          <Tabs activeIndex={0}>
            <Tab testId="agent-edit-instructions" label="Instructions" className="editorMain">
              <MonacoEditor
                data-testid="agent-instructions-editor"
                language="markdown"
                height="100%"
                value={agent?.instructions}
                onChange={(value) => dispatch(editAgent({ ...agent, instructions: value }))}
              />
            </Tab>
            <Tab testId="agent-edit-roles" label="Roles" className="editorMain">
              <GoAButtonGroup alignment="start">
                <GoACheckbox
                  name="showSelectedRoles"
                  text="Show selected roles"
                  checked={showSelectedRoles}
                  onChange={() => setShowSelectedRoles((prev) => !prev)}
                />
              </GoAButtonGroup>
              <div style={{ overflow: 'auto' }}>
                {filteredRoles?.map(({ clientId, roleNames }) => {
                  return (
                    <ClientRoleTable
                      key={clientId}
                      roles={roleNames}
                      clientId={clientId}
                      roleSelectFunc={(roles: string[]) => dispatch(editAgent({ ...agent, userRoles: roles }))}
                      nameColumnWidth={80}
                      service="Agent"
                      checkedRoles={[{ title: 'Use agent', selectedRoles: agent?.userRoles }]}
                    />
                  );
                })}
              </div>
            </Tab>
          </Tabs>
          <hr />
          <GoAButtonGroup alignment="start" mt="m" mb="xl">
            <GoAButton
              disabled={!hasChanges}
              onClick={() => dispatch(updateAgent(agent))}
              type="primary"
              testId="template-form-save"
            >
              Save
            </GoAButton>
            <GoAButton onClick={() => navigate('..')} testId="template-form-close" type="secondary">
              Back
            </GoAButton>
          </GoAButtonGroup>
        </section>
      }
      preview={
        <>
          <h2>Preview</h2>
          <hr />
          <ChatContainerDiv>
            <AgentChat
              threadId={threadId}
              context={{}}
              messages={messages}
              onSend={(threadId, context, content) => dispatch(messageAgent(threadId, context, content))}
            />
          </ChatContainerDiv>
        </>
      }
    />
  );
};
