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
import { selectRoleList } from '@store/sharedSelectors/roles';

export const AgentEditor: FunctionComponent = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const indicator = useSelector((state: RootState) => state?.session?.indicator);

  const roles = useSelector(selectRoleList);
  const { agent, hasChanges, threadId } = useSelector(editorSelector);
  const messages = useSelector((state: RootState) => messagesSelector(state, threadId));

  const [showSelectedRoles, setShowSelectedRoles] = useState(false);

  const dispatch = useDispatch<AppDispatch>();
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
                {roles?.map(({ clientId, roleNames }, key) => {
                  // const rolesMap = getFilteredRoles(e.roleNames, e.clientId, {
                  //   userRoles: agent?.applicantRoles,
                  // });
                  return (
                    <ClientRoleTable
                      key={clientId}
                      roles={roleNames}
                      clientId={clientId}
                      roleSelectFunc={(roles: string[]) => dispatch(editAgent({ ...agent, userRoles: roles }))}
                      nameColumnWidth={80}
                      service="Agent"
                      checkedRoles={[{ title: 'use', selectedRoles: agent?.userRoles }]}
                    />
                  );
                })}
              </div>
            </Tab>
          </Tabs>
          <hr />
          <GoAButtonGroup alignment="start" mt="m" mb="xl">
            <GoAButton disabled={!hasChanges} onClick={() => dispatch(updateAgent(agent))} type="primary" testId="template-form-save">
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
          <AgentChat
            threadId={threadId}
            context={{}}
            messages={messages}
            onSend={(threadId, context, content) => dispatch(messageAgent(threadId, context, content))}
          />
        </>
      }
    />
  );
};
