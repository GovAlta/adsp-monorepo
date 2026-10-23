import React, { FunctionComponent, useCallback, useEffect, useRef, useState } from 'react';
import {
  GoabAccordion,
  GoabButton,
  GoabCallout,
  GoabCircularProgress,
  GoabDetails,
  GoabFormItem,
  GoabIconButton,
  GoabTextArea,
} from '@abgov/react-components';
import styled from 'styled-components';
import { PlannerApi } from './api';
import { ConfirmDelete } from './ConfirmDelete';
import { AnalysisMode, ChatMessage, ChatSummary, Solution, SpecialistDefinition, SpecialistIntent } from './model';
import { useBusy } from './useBusy';
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

const HeaderRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
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
    <GoabCallout type="information" heading={specialistName} testId="chat-assistant-message">
      <Text>{message.content}</Text>
      {message.warning && <p>{message.warning}</p>}
      {message.consult && (
        <>
          <p>
            <strong>Fit:</strong> {message.consult.fit}
          </p>
          <BulletList title="Can support" items={message.consult.supports} />
          <BulletList title="Constraints" items={message.consult.constraints} />
          <BulletList title="Questions" items={message.consult.questions} />
          <BulletList title="Risks" items={message.consult.risks} />
          {message.consult.advice && <Text>{message.consult.advice}</Text>}
          {message.consult.validation && (
            <p>
              <strong>Verdict:</strong> {message.consult.validation.verdict}
            </p>
          )}
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
  context?: { label: string; description: string };
  onChatsChanged?: () => void;
}

export const SpecialistChat: FunctionComponent<SpecialistChatProps> = ({
  service,
  specialist,
  solution,
  api,
  mode,
  context,
  onChatsChanged,
}) => {
  const [chats, setChats] = useState<ChatSummary[]>([]);
  const [chatId, setChatId] = useState<string>();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [intent, setIntent] = useState<SpecialistIntent>('ask');
  const [draft, setDraft] = useState('');
  const [busy, run] = useBusy();
  const [deletingChatId, setDeletingChatId] = useState<string>();
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
    setDraft('');
    void loadChats();
  }, [loadChats]);

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
      setDeletingChatId(undefined);
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
      const result = await api.consult(solution.id, service, { mode });
      const at = new Date().toISOString();
      setMessages((current) => [
        ...current,
        { role: 'user', content: 'Consult on this solution', at },
        {
          role: 'assistant',
          content: result.reason,
          at,
          consult: {
            fit: result.fit,
            supports: result.supports,
            constraints: result.constraints,
            risks: result.risks,
            questions: result.questions,
            advice: result.advice,
            validation: result.validation,
          },
        },
      ]);
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
      <h3 data-testid="chat-heading">{displayName}</h3>
      {context && (
        <p data-testid="chat-context">
          <strong>{context.label}:</strong> {context.description}
        </p>
      )}

      {solution && (
        <GoabButton size="compact" type="secondary" disabled={busy} mb="m" testId="chat-consult" onClick={runConsult}>
          Consult on this solution
        </GoabButton>
      )}

      {chats.length > 0 && (
        <>
          <HeaderRow>
            <h3 style={{ margin: 0 }}>Saved chats ({chats.length})</h3>
            <Row role="group" aria-label="Export chats">
              <GoabIconButton
                icon="document-text"
                title="Export all chats as Markdown"
                ariaLabel="Export all chats as Markdown"
                disabled={busy}
                testId="chat-download-all-md"
                onClick={() => downloadAll('md')}
              />
              <GoabIconButton
                icon="code-download"
                title="Export all chats as JSON"
                ariaLabel="Export all chats as JSON"
                disabled={busy}
                testId="chat-download-all-json"
                onClick={() => downloadAll('json')}
              />
              {chatId && (
                <>
                  <GoabIconButton
                    icon="document-text"
                    title="Export this chat as Markdown"
                    ariaLabel="Export this chat as Markdown"
                    disabled={busy}
                    testId="chat-download-current-md"
                    onClick={() => downloadCurrent('md')}
                  />
                  <GoabIconButton
                    icon="code-download"
                    title="Export this chat as JSON"
                    ariaLabel="Export this chat as JSON"
                    disabled={busy}
                    testId="chat-download-current-json"
                    onClick={() => downloadCurrent('json')}
                  />
                </>
              )}
            </Row>
          </HeaderRow>
          {chats.map((chat) => (
            <GoabAccordion
              key={chat.id}
              heading={chat.title}
              secondaryText={`${chat.messageCount} messages \u00b7 ${fmtDate(chat.updatedOn)}`}
              open={chat.id === chatId}
              mb="s"
              testId={`chat-accordion-${chat.id}`}
              onChange={(open) => (open ? openChat(chat.id) : newChat())}
              actions={
                <GoabIconButton
                  icon="trash"
                  variant="destructive"
                  title="Delete this chat"
                  ariaLabel={`Delete chat ${chat.title}`}
                  testId={`chat-delete-${chat.id}`}
                  onClick={() => setDeletingChatId(chat.id)}
                />
              }
            >
              {chat.id === chatId && (
                <Turns>
                  {messages.map((message, i) => (
                    <Message
                      key={`${i}-${message.at}`}
                      message={message}
                      specialistName={displayName}
                      disabled={busy}
                      onFollowUp={send}
                    />
                  ))}
                </Turns>
              )}
            </GoabAccordion>
          ))}
        </>
      )}

      <GoabCircularProgress visible={busy} message="Working..." size="small" testId="chat-progress" />

      {messages.length > 0 && !chats.some((chat) => chat.id === chatId) && (
        <Turns data-testid="chat-draft-turns">
          {messages.map((message, i) => (
            <Message
              key={`${i}-${message.at}`}
              message={message}
              specialistName={displayName}
              disabled={busy}
              onFollowUp={send}
            />
          ))}
        </Turns>
      )}

      <Row role="group" aria-label="Message intent">
        <strong>Response type:</strong>
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

      {deletingChatId && (
        <ConfirmDelete
          open
          testIdPrefix="delete-chat"
          heading="Delete this chat?"
          busy={busy}
          onCancel={() => setDeletingChatId(undefined)}
          onConfirm={() => deleteChat(deletingChatId)}
        >
          This action cannot be undone.{' '}
          <strong>{chats.find((c) => c.id === deletingChatId)?.title ?? 'This chat'}</strong> and its messages will be
          permanently removed.
        </ConfirmDelete>
      )}
    </section>
  );
};
