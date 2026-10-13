import React, { FunctionComponent, useCallback, useEffect, useRef, useState } from 'react';
import {
  GoabBadge,
  GoabButton,
  GoabCallout,
  GoabCircularProgress,
  GoabDetails,
  GoabFormItem,
  GoabTextArea,
} from '@abgov/react-components';
import styled from 'styled-components';
import { PlannerApi } from './api';
import {
  AnalysisMode,
  ChatMessage,
  ChatSummary,
  ConsultResult,
  Solution,
  SpecialistDefinition,
  SpecialistIntent,
} from './model';
import { chatToMarkdown, download, fmtDate, safeName } from './utils';

export const INTENTS: [SpecialistIntent, string][] = [
  ['ask', 'Ask'],
  ['recommend', 'Recommend'],
  ['design', 'Refine design'],
  ['validate', 'Validate'],
  ['sample', 'Sample code'],
];

const Row = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.5rem;
  margin: 0.5rem 0;
`;

const Pre = styled.pre`
  white-space: pre-wrap;
  overflow: auto;
`;

const Text = styled.div`
  white-space: pre-wrap;
`;

const Turns = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin: 1rem 0;
`;

/** Counts saved chats per specialist service, e.g. to label a specialist list as 'Form (3)'. */
export function countChatsByService(chats: ChatSummary[]): Record<string, number> {
  return (chats || []).reduce<Record<string, number>>((counts, chat) => {
    counts[chat.service] = (counts[chat.service] || 0) + 1;
    return counts;
  }, {});
}

const BulletList: FunctionComponent<{ title: string; items?: string[] }> = ({ title, items }) =>
  items?.length ? (
    <>
      <p>
        <strong>{title}</strong>
      </p>
      <ul>
        {items.map((item, i) => (
          <li key={`${i}-${item}`}>{item}</li>
        ))}
      </ul>
    </>
  ) : null;

interface MessageProps {
  message: ChatMessage;
  specialistName: string;
  disabled: boolean;
  onFollowUp: (text: string) => void;
}

const Message: FunctionComponent<MessageProps> = ({ message, specialistName, disabled, onFollowUp }) => {
  if (message.role === 'user') {
    return (
      <GoabCallout type="important" heading="You" testId="chat-user-message">
        <Text>{message.content}</Text>
      </GoabCallout>
    );
  }

  return (
    <GoabCallout
      type="information"
      heading={`${specialistName}${message.mode === 'rules' ? ' (rule-based)' : ''}`}
      testId="chat-assistant-message"
    >
      <Text>{message.content}</Text>
      {message.warning && <p>{message.warning}</p>}
      {message.consult && (
        <>
          <p>
            <strong>Fit:</strong> {message.consult.fit}
          </p>
          <BulletList title="Can support" items={message.consult.supports} />
          <BulletList title="Constraints" items={message.consult.constraints} />
          <BulletList title="Risks" items={message.consult.risks} />
        </>
      )}
      {message.validation && (
        <>
          <p>
            <strong>Verdict:</strong> {message.validation.verdict}
          </p>
          <BulletList title="Findings" items={message.validation.findings} />
        </>
      )}
      <BulletList title="Recommendations" items={message.suggestions} />
      {(message.samples || []).map((sample, i) => (
        <GoabDetails key={`${i}-${sample.title}`} heading={sample.title || sample.language}>
          <Pre>{sample.code}</Pre>
        </GoabDetails>
      ))}
      {message.followUps?.length > 0 && (
        <Row>
          {message.followUps.map((followUp) => (
            <GoabButton
              key={followUp}
              type="tertiary"
              size="compact"
              disabled={disabled}
              testId="chat-follow-up"
              onClick={() => onFollowUp(followUp)}
            >
              {followUp}
            </GoabButton>
          ))}
        </Row>
      )}
    </GoabCallout>
  );
};

interface SpecialistChatProps {
  service: string;
  specialist?: SpecialistDefinition;
  solution?: Solution;
  api: PlannerApi;
  mode: AnalysisMode;
  onChatsChanged?: () => void;
}

export const SpecialistChat: FunctionComponent<SpecialistChatProps> = ({
  service,
  specialist,
  solution,
  api,
  mode,
  onChatsChanged,
}) => {
  const [chats, setChats] = useState<ChatSummary[]>([]);
  const [chatId, setChatId] = useState<string>();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [intent, setIntent] = useState<SpecialistIntent>('ask');
  const [draft, setDraft] = useState('');
  const [busy, setBusy] = useState(false);
  const [consult, setConsult] = useState<ConsultResult>();
  const onChatsChangedRef = useRef(onChatsChanged);
  onChatsChangedRef.current = onChatsChanged;

  const solutionId = solution?.id;
  const displayName = specialist?.displayName || service;

  const loadChats = useCallback(async () => {
    try {
      setChats(await api.listChats({ service, solutionId }));
    } catch {
      setChats([]);
    }
  }, [api, service, solutionId]);

  const refreshChats = useCallback(async () => {
    await loadChats();
    onChatsChangedRef.current?.();
  }, [loadChats]);

  useEffect(() => {
    setChatId(undefined);
    setMessages([]);
    setConsult(undefined);
    setDraft('');
    void loadChats();
  }, [loadChats]);

  // Runs an action with the busy indicator; failures are reported by the api layer.
  const run = async (action: () => Promise<void>) => {
    setBusy(true);
    try {
      await action();
    } catch {
      // Error notification is raised by the api.
    } finally {
      setBusy(false);
    }
  };

  const openChat = (id: string) =>
    run(async () => {
      const chat = await api.getChat(id);
      setChatId(chat.id);
      setMessages(chat.messages);
    });

  const deleteChat = (id: string) =>
    run(async () => {
      await api.deleteChat(id);
      if (id === chatId) {
        setChatId(undefined);
        setMessages([]);
      }
      await refreshChats();
    });

  const newChat = () => {
    setChatId(undefined);
    setMessages([]);
  };

  const send = (text: string) => {
    const message = text.trim();
    if (busy || !message) {
      return Promise.resolve();
    }
    return run(async () => {
      setDraft('');
      const res = await api.specialistChat(service, { message, chatId, intent, solutionId, mode });
      const at = new Date().toISOString();
      setChatId(res.chatId);
      setMessages((current) => [
        ...current,
        { role: 'user', content: message, at },
        {
          role: 'assistant',
          content: res.reply,
          at,
          mode: res.mode,
          warning: res.warning,
          validation: res.validation,
          suggestions: res.suggestions,
          samples: res.samples,
          followUps: res.followUps,
        },
      ]);
      await refreshChats();
    });
  };

  const runConsult = () =>
    run(async () => {
      setConsult(await api.consult(solution.id, service, { mode }));
      await refreshChats();
    });

  const filename = (suffix: string, ext: string) =>
    `${solution ? safeName(solution) : 'planner'}-${service}-${suffix}.${ext}`;

  const downloadAll = (format: 'md' | 'json') =>
    run(async () => {
      const exported = await api.exportAllChats({ service, solutionId });
      if (format === 'md') {
        download(filename('chats', 'md'), exported.chats.map(chatToMarkdown).join('\n'), 'text/markdown');
      } else {
        download(filename('chats', 'json'), JSON.stringify(exported, null, 2), 'application/json');
      }
    });

  const downloadCurrent = (format: 'md' | 'json') =>
    run(async () => {
      if (format === 'md') {
        download(filename('chat', 'md'), chatToMarkdown(await api.getChat(chatId)), 'text/markdown');
      } else {
        download(filename('chat', 'json'), JSON.stringify(await api.exportChat(chatId), null, 2), 'application/json');
      }
    });

  return (
    <section aria-label={`Chat with ${displayName}`}>
      <h2 data-testid="chat-heading">Specialist chat: {displayName}</h2>

      {solution && (
        <>
          <GoabButton size="compact" type="secondary" disabled={busy} testId="chat-consult" onClick={runConsult}>
            Consult on this solution
          </GoabButton>
          {consult && (
            <GoabCallout type="information" heading={`Consultation: ${consult.fit}`} testId="chat-consult-result">
              <p>{consult.reason}</p>
              <BulletList title="Can support" items={consult.supports} />
              <BulletList title="Constraints" items={consult.constraints} />
              <BulletList title="Questions" items={consult.questions} />
              <BulletList title="Risks" items={consult.risks} />
              {consult.advice && <Text>{consult.advice}</Text>}
              {consult.validation && (
                <p>
                  <strong>Verdict:</strong> {consult.validation.verdict}
                </p>
              )}
            </GoabCallout>
          )}
        </>
      )}

      {chats.length > 0 ? (
        <GoabDetails heading={`Saved chats (${chats.length})`} open testId="chat-history">
          <ul>
            {chats.map((chat) => (
              <li key={chat.id}>
                <Row>
                  <span>
                    {chat.title}{' '}
                    <GoabBadge type="light" icon={false} content={`${chat.messageCount} messages`} />{' '}
                    {fmtDate(chat.updatedOn)}
                  </span>
                  <GoabButton
                    type="tertiary"
                    size="compact"
                    disabled={busy}
                    testId={`chat-open-${chat.id}`}
                    onClick={() => openChat(chat.id)}
                  >
                    {chat.id === chatId ? 'Open (current)' : 'Open'}
                  </GoabButton>
                  <GoabButton
                    type="tertiary"
                    size="compact"
                    disabled={busy}
                    testId={`chat-delete-${chat.id}`}
                    onClick={() => deleteChat(chat.id)}
                  >
                    Delete
                  </GoabButton>
                </Row>
              </li>
            ))}
          </ul>
        </GoabDetails>
      ) : (
        <p data-testid="chat-no-history">No saved chats with this specialist yet.</p>
      )}

      <Row>
        <GoabButton type="secondary" size="compact" disabled={busy} testId="chat-new" onClick={newChat}>
          New chat
        </GoabButton>
      </Row>
      <Row role="group" aria-label="Download all chats">
        <strong>All chats:</strong>
        <GoabButton type="tertiary" size="compact" leadingIcon="download" disabled={busy} testId="chat-download-all-md" onClick={() => downloadAll('md')}>
          Markdown
        </GoabButton>
        <GoabButton type="tertiary" size="compact" leadingIcon="download" disabled={busy} testId="chat-download-all-json" onClick={() => downloadAll('json')}>
          JSON
        </GoabButton>
      </Row>
      {chatId && (
        <Row role="group" aria-label="Download this chat">
          <strong>This chat:</strong>
          <GoabButton type="tertiary" size="compact" leadingIcon="download" disabled={busy} testId="chat-download-current-md" onClick={() => downloadCurrent('md')}>
            Markdown
          </GoabButton>
          <GoabButton type="tertiary" size="compact" leadingIcon="download" disabled={busy} testId="chat-download-current-json" onClick={() => downloadCurrent('json')}>
            JSON
          </GoabButton>
        </Row>
      )}

      <Row role="group" aria-label="Message intent">
        {INTENTS.map(([key, label]) => (
          <GoabButton
            key={key}
            type={intent === key ? 'primary' : 'secondary'}
            size="compact"
            testId={`chat-intent-${key}`}
            onClick={() => setIntent(key)}
          >
            {label}
          </GoabButton>
        ))}
      </Row>

      <Turns>
        {messages.map((message, i) => (
          <Message key={`${i}-${message.at}`} message={message} specialistName={displayName} disabled={busy} onFollowUp={send} />
        ))}
      </Turns>

      <GoabCircularProgress visible={busy} message="Working..." size="small" testId="chat-progress" />

      <GoabFormItem label="Message to the specialist" mb="m">
        <GoabTextArea
          name="specialist-message"
          value={draft}
          rows={3}
          width="100%"
          disabled={busy}
          testId="chat-input"
          onChange={(detail) => setDraft(detail.value)}
        />
      </GoabFormItem>
      <GoabButton disabled={busy || !draft.trim()} testId="chat-send" onClick={() => send(draft)}>
        Send
      </GoabButton>
    </section>
  );
};
