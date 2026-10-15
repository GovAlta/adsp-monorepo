import React, { FunctionComponent, useState } from 'react';
import {
  GoabBadge,
  GoabButton,
  GoabCircularProgress,
  GoabContainer,
  GoabFormItem,
  GoabTextArea,
} from '@abgov/react-components';
import { PaneProps } from './workplaceTypes';

interface QuestionsPaneProps extends PaneProps {
  title: string;
}

export const QuestionsPane: FunctionComponent<QuestionsPaneProps> = ({
  solution,
  api,
  mode,
  busy,
  run,
  onSolutionChange,
  title,
}) => {
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const { questions, analysis } = solution.state;
  const open = questions.filter((q) => q.status === 'open').length;

  const saveAnswer = (id: string, fallback: string) =>
    run(async () => {
      onSolutionChange(await api.answerQuestion(solution.id, id, drafts[id] ?? fallback));
      setDrafts(({ [id]: _removed, ...rest }) => rest);
    });
  const refine = () => run(async () => onSolutionChange(await api.analyze(solution.id, { mode })));

  return (
    <div data-testid="questions-pane">
      <h2>{title}</h2>
      {!analysis && <p>Save and analyze the problem first; questions to refine the solution will appear here.</p>}
      {analysis && questions.length === 0 && <p>No questions yet.</p>}
      {questions.length > 0 && (
        <p>
          {open} open · {questions.length - open} answered. Answer questions, then refine the analysis.
        </p>
      )}
      {questions.map((q) => (
        <GoabContainer key={q.id} type="non-interactive" accent="thin" mb="m" testId={`question-${q.id}`}>
          <p>
            <strong>{q.question}</strong>{' '}
            <GoabBadge type={q.status === 'open' ? 'important' : 'success'} content={q.status} /> ({q.raisedBy})
          </p>
          <GoabFormItem label={`Answer to: ${q.question}`} mb="s">
            <GoabTextArea
              name={`answer-${q.id}`}
              value={drafts[q.id] ?? q.answer ?? ''}
              rows={2}
              width="100%"
              maxWidth="100%"
              testId={`answer-${q.id}`}
              disabled={busy}
              onChange={(detail) => setDrafts((d) => ({ ...d, [q.id]: detail.value }))}
            />
          </GoabFormItem>
          <GoabButton
            type="secondary"
            size="compact"
            testId={`save-answer-${q.id}`}
            disabled={busy}
            onClick={() => saveAnswer(q.id, q.answer ?? '')}
          >
            {q.status === 'answered' ? 'Update answer' : 'Save answer'}
          </GoabButton>
        </GoabContainer>
      ))}
      {questions.length > 0 && (
        <GoabButton type="primary" testId="refine-analysis" disabled={busy} onClick={refine}>
          {busy ? 'Refining…' : 'Refine analysis with my answers'}
        </GoabButton>
      )}
      {busy && <GoabCircularProgress visible size="small" message="Working — this can take up to a minute" />}
    </div>
  );
};

export default QuestionsPane;
