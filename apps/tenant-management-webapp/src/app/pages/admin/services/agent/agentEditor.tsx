import { GoAButton, GoAButtonGroup, GoACallout, GoACheckbox, GoAIconButton, GoATable } from '@abgov/react-components';
import { AgentChat } from '@core-services/app-common';
import MonacoEditor from '@monaco-editor/react';
import { FunctionComponent, useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useParams } from 'react-router-dom';
import { DeleteModal } from '@components/DeleteModal';
import { EditorConfigurationForm } from '@components/EditorConfigurationForm';
import { FullScreenEditor } from '@components/FullScreenEditor';
import { Tab, Tabs } from '@components/Tabs';
import { ClientRoleTable } from '@components/RoleTable';
import { AppDispatch, RootState } from '@store/index';
import { FetchRealmRoles } from '@store/tenant/actions';
import { fetchKeycloakServiceRoles } from '@store/access/actions';
import {
  agentConnectedSelector,
  availableToolsSelector,
  busySelector,
  editorSelector,
  messagesSelector,
} from '@store/agent/selectors';
import {
  connectAgent,
  disconnectAgent,
  editAgent,
  messageAgent,
  newPreviewThread,
  startEditAgent,
  startThread,
  updateAgent,
} from '@store/agent/actions';
import { ApiToolConfiguration } from '@store/agent/model';
import { connectConfigurationUpdates, disconnectConfigurationUpdates } from '@store/configuration/action';
import { fetchDirectory } from '@store/directory/actions';
import { filteredRoleListSelector } from '@store/sharedSelectors/roles';
import styled from 'styled-components';
import { AddEditApiToolModal } from './addEditApiToolModal';
import { AddBuiltInToolModal } from './addBuiltInToolModal';

const ChatContainerDiv = styled.div`
  flex: 1;
  position: relative;
  overflow: hidden;
`;

const defaultApiToolValue: ApiToolConfiguration = {
  type: 'api',
  id: '',
  description: '',
  inputSchema: { type: 'object' },
  outputSchema: { type: 'object' },
  method: 'GET',
  api: '',
  path: '',
};

export const AgentEditor: FunctionComponent = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [showSelectedRoles, setShowSelectedRoles] = useState(false);
  const [toolToDelete, setToolToDelete] = useState<{ id: string; index: number } | null>(null);
  const [toolToEdit, setToolToEdit] = useState<ApiToolConfiguration | null>(null);
  const [showBuiltInToolModal, setShowBuiltInToolModal] = useState(false);

  const availableTools = useSelector(availableToolsSelector);
  const connected = useSelector(agentConnectedSelector);
  const { saving } = useSelector(busySelector);
  const { agent, hasChanges, stalePreview, threadId } = useSelector(editorSelector);
  const messages = useSelector((state: RootState) => messagesSelector(state, threadId));

  const filteredRoles = useSelector((state: RootState) =>
    filteredRoleListSelector(state, 'agent.editor.agent.userRoles', showSelectedRoles)
  );

  const dispatch = useDispatch<AppDispatch>();
  useEffect(() => {
    dispatch(FetchRealmRoles());
    dispatch(fetchKeycloakServiceRoles());
    dispatch(fetchDirectory());
  }, [dispatch]);

  useEffect(() => {
    dispatch(startEditAgent(id));
  }, [dispatch, id]);

  useEffect(() => {
    dispatch(
      connectConfigurationUpdates(({ namespace, name }) => {
        if (namespace === 'platform' && name === 'agent-service') {
          dispatch(newPreviewThread());
        }
      })
    );

    return () => {
      dispatch(disconnectConfigurationUpdates());
    };
  }, [dispatch]);

  useEffect(() => {
    dispatch(connectAgent()).then(() => dispatch(startThread(id, threadId)));

    return () => {
      dispatch(disconnectAgent());
    };
  }, [dispatch, id, threadId]);

  return (
    <FullScreenEditor
      onGoBack={() => navigate('/admin/services/agent')}
      editor={
        <section>
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
            <Tab testId="agent-edit-tools" label="Tools" className="editorMain">
              <GoAButtonGroup alignment="start" mt="s" gap="compact">
                <GoAButton type="tertiary" size="compact" onClick={() => setToolToEdit({ ...defaultApiToolValue })}>
                  Add API tool
                </GoAButton>
                <GoAButton type="tertiary" size="compact" onClick={() => setShowBuiltInToolModal(true)}>
                  Add built-in tool
                </GoAButton>
              </GoAButtonGroup>
              <div style={{ overflow: 'auto' }}>
                <GoATable>
                  <colgroup>
                    <col />
                    <col />
                    <col style={{ width: '100px' }} />
                  </colgroup>
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Description</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {agent?.tools?.map((tool, index) =>
                      typeof tool === 'string' ? (
                        <tr key={tool}>
                          <td>{tool}</td>
                          <td>{availableTools.find(({ id }) => tool === id)?.description}</td>
                          <td>
                            <GoAButtonGroup alignment="end" gap="compact">
                              <GoAIconButton
                                icon="trash"
                                size="small"
                                onClick={() => setToolToDelete({ id: tool, index })}
                              />
                            </GoAButtonGroup>
                          </td>
                        </tr>
                      ) : (
                        <tr key={tool.id}>
                          <td>{tool.id}</td>
                          <td>{tool.description}</td>
                          <td>
                            <GoAButtonGroup alignment="end" gap="compact">
                              <GoAIconButton icon="create" size="small" onClick={() => setToolToEdit(tool)} />
                              <GoAIconButton
                                icon="trash"
                                size="small"
                                onClick={() => setToolToDelete({ id: tool.id, index })}
                              />
                            </GoAButtonGroup>
                          </td>
                        </tr>
                      )
                    )}
                  </tbody>
                </GoATable>
              </div>
            </Tab>
            <Tab testId="agent-edit-roles" label="Roles" className="editorMain">
              <GoAButtonGroup alignment="start" mt="s">
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
              disabled={saving || !hasChanges}
              onClick={() => dispatch(updateAgent(agent))}
              type="primary"
              testId="agent-form-save"
            >
              Save
            </GoAButton>
            <GoAButton onClick={() => navigate('../agents')} testId="agent-form-close" type="secondary">
              Back
            </GoAButton>
          </GoAButtonGroup>
          <DeleteModal
            isOpen={toolToDelete !== null}
            title="Delete tool"
            content={
              <div>
                Are you sure you wish to delete <b>{toolToDelete?.id}</b>?
              </div>
            }
            onCancel={() => setToolToDelete(null)}
            onDelete={() => {
              if (toolToDelete) {
                const tools = [...agent.tools];
                tools.splice(toolToDelete.index, 1);
                dispatch(editAgent({ ...agent, tools }));
                setToolToDelete(null);
              }
            }}
          />
          <AddEditApiToolModal
            tool={toolToEdit}
            open={!!toolToEdit}
            onCancel={() => setToolToEdit(null)}
            onOK={(update) => {
              const tools = [...(agent.tools || [])];
              const index = tools.findIndex((tool) => typeof tool === 'object' && tool.id === update.id);
              if (index > -1) {
                tools.splice(index, 1, update);
              } else {
                tools.push(update);
              }
              dispatch(editAgent({ ...agent, tools }));
              setToolToEdit(null);
            }}
          />
          <AddBuiltInToolModal
            availableTools={availableTools}
            open={showBuiltInToolModal}
            tools={agent?.tools?.filter((tool) => typeof tool === 'string')}
            onCancel={() => setShowBuiltInToolModal(false)}
            onOK={(selected) => {
              const update = [...selected, ...(agent?.tools?.filter((tool) => typeof tool === 'object') || [])];
              dispatch(editAgent({ ...agent, tools: update }));
              setShowBuiltInToolModal(false);
            }}
          />
        </section>
      }
      preview={
        <>
          <h2>Preview</h2>
          <hr />
          {stalePreview && (
            <GoACallout type="information" size="medium" mb="none">
              You have unsaved or recently saved changes. Preview will reset after agent update.
            </GoACallout>
          )}
          <ChatContainerDiv>
            <AgentChat
              disabled={!connected}
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
