import { GoabIconButton } from '@abgov/react-components';
import { FunctionComponent, useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { io } from 'socket.io-client';
import styled from 'styled-components';
import {
  AppDispatch,
  AppState,
  applyServerFormUpdate,
  directorySelector,
  getAccessToken,
  selectTopic,
  selectedTopicSelector,
} from '../state';
import CommentsViewer from './CommentsViewer';
import { FormAgentChat } from './FormAgentChat';

const AGENT_SERVICE_ID = 'urn:ads:platform:agent-service';

interface SupportPaneForm {
  id: string;
  urn: string;
  definition: {
    id: string;
  };
}

interface FormSupportPaneProps {
  className?: string;
  form: SupportPaneForm | null;
  data: Record<string, unknown>;
  files: Record<string, string>;
}

function resolveAgentServiceUrl(directory: Record<string, string>): string | undefined {
  const direct = directory[AGENT_SERVICE_ID] || directory[`${AGENT_SERVICE_ID}:v1`];
  if (direct) {
    return direct;
  }

  const found = Object.entries(directory).find(([urn]) => urn.startsWith(AGENT_SERVICE_ID));
  return found?.[1];
}

const FormSupportPaneComponent: FunctionComponent<FormSupportPaneProps> = ({ className, form, data, files }) => {
  const dispatch = useDispatch<AppDispatch>();
  const topic = useSelector(selectedTopicSelector);
  const directory = useSelector(directorySelector);
  const connectedUser = useSelector((state: AppState) => state.user.user);

  const agentServiceUrl = useMemo(() => resolveAgentServiceUrl(directory), [directory]);

  const [showSupportPane, setShowSupportPane] = useState(false);
  const [supportTab, setSupportTab] = useState<'comments' | 'agent'>('agent');
  const [agentConnected, setAgentConnected] = useState(false);

  const showCommentsFeature = !!topic;
  const showAgentFeature = !!agentServiceUrl && agentConnected;
  const hasSupportFeature = showCommentsFeature || showAgentFeature;
  const showSupportTabs = showCommentsFeature && showAgentFeature;

  useEffect(() => {
    if (!agentServiceUrl || !connectedUser) {
      setAgentConnected(false);
      return;
    }

    const socket = io(agentServiceUrl, {
      withCredentials: true,
      auth: async (cb) => {
        try {
          const token = await getAccessToken();
          cb(token ? { token } : null);
        } catch {
          cb(null);
        }
      },
      timeout: 5000,
    });

    socket.on('connect', () => {
      setAgentConnected(true);
      socket.disconnect();
    });

    socket.on('connect_error', () => {
      setAgentConnected(false);
    });

    return () => {
      socket.disconnect();
    };
  }, [agentServiceUrl, connectedUser]);

  useEffect(() => {
    if (supportTab === 'comments' && showCommentsFeature) {
      return;
    }

    if (showAgentFeature) {
      setSupportTab('agent');
    } else if (showCommentsFeature) {
      setSupportTab('comments');
    }
  }, [showAgentFeature, showCommentsFeature, supportTab]);

  return (
    <div className={className} data-show={showSupportPane}>
      <div className="supportPane">
        {showSupportTabs && (
          <div className="supportTabs">
            <button
              type="button"
              data-active={supportTab === 'comments'}
              onClick={() => {
                setSupportTab('comments');
                if (topic.resourceId !== form?.urn) {
                  dispatch(selectTopic({ resourceId: form.urn }));
                }
              }}
            >
              Comments
            </button>
            <button type="button" data-active={supportTab === 'agent'} onClick={() => setSupportTab('agent')}>
              AI
            </button>
          </div>
        )}
        <div className="supportContent" data-tab={supportTab}>
          {supportTab === 'comments' && topic ? (
            <CommentsViewer />
          ) : showAgentFeature ? (
            form && (
              <FormAgentChat
                formId={form.id}
                formDefinitionId={form.definition.id}
                onFormUpdate={(update) => {
                  dispatch(
                    applyServerFormUpdate({
                      id: update.id || form.id,
                      data: update.data || data,
                      files: update.files || files,
                    })
                  );
                }}
              />
            )
          ) : null}
        </div>
      </div>
      <GoabIconButton
        disabled={!form || !hasSupportFeature}
        icon="help-circle"
        size="large"
        title="Support"
        onClick={() => {
          if (!hasSupportFeature) {
            return;
          }

          const nextShow = !showSupportPane;
          setShowSupportPane(nextShow);

          if (nextShow && supportTab === 'comments' && topic?.resourceId !== form?.urn) {
            dispatch(selectTopic({ resourceId: form.urn }));
          }
        }}
      />
    </div>
  );
};

export const FormSupportPane = styled(FormSupportPaneComponent)`
  position: relative;
  height: 100%;
  flex: 0 0 0;
  width: 0;
  min-width: 0;

  .supportPane {
    display: none;
    height: 100%;
    width: 100%;
    border-right: 1px solid var(--goa-color-greyscale-200);
    background: white;

    .supportTabs {
      display: flex;
      gap: var(--goa-space-2xs);
      padding: var(--goa-space-xs);
      border-bottom: 1px solid var(--goa-color-greyscale-200);
      background: var(--goa-color-greyscale-100);

      button {
        border: 1px solid var(--goa-color-greyscale-200);
        border-radius: var(--goa-border-radius-s);
        background: white;
        font-size: var(--goa-font-size-1);
        padding: var(--goa-space-2xs) var(--goa-space-xs);
        cursor: pointer;
      }

      button[data-active='true'] {
        border-color: var(--goa-color-interactive-default);
      }
    }

    .supportContent {
      height: 100%;
    }

    .supportTabs + .supportContent {
      height: calc(100% - 40px);
    }

    .supportContent[data-tab='agent'] {
      box-sizing: border-box;
      padding-bottom: calc(var(--goa-space-2xl) + var(--goa-space-l));
    }

    .supportContent[data-tab='agent'] > * > :first-child {
      padding-left: var(--goa-space-l);
      padding-right: var(--goa-space-l);
      box-sizing: border-box;
    }

    .supportContent > * {
      height: 100%;
    }

    @media (max-width: 639px) {
      z-index: 2;
      position: absolute;
      top: 0;
      bottom: 0;
      left: 0;
      right: 0;
    }
  }

  &[data-show='true'] .supportPane {
    display: block;
  }

  &[data-show='true'] {
    flex: 1 1 30%;
    width: auto;
    min-width: 300px;
  }

  > :last-child {
    z-index: 3;
    position: absolute;
    bottom: var(--goa-space-l);
    left: var(--goa-space-l);
    background: white;
  }

  &[data-show='true'] > :last-child {
    background: var(--goa-color-greyscale-100);
  }
`;
