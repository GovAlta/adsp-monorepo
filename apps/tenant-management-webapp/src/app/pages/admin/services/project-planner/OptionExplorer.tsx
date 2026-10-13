import React, { FunctionComponent, useEffect, useState } from 'react';
import { GoabBadge, GoabButton, GoabCallout, GoabCircularProgress, GoabContainer } from '@abgov/react-components';
import { BusinessPattern, ConfidenceLevel, PatternMatch, Solution } from './model';
import QuestionsPane from './QuestionsPane';
import SpecialistRail from './SpecialistRail';
import { PaneLayout } from './workplaceLayout';
import { ModeProps } from './workplaceTypes';

const levelType: Record<ConfidenceLevel, 'success' | 'important' | 'information'> = {
  high: 'success',
  medium: 'important',
  low: 'information',
};

const ALTERNATIVES_PROMPT =
  'Suggest 2-3 alternative workflows or solution approaches for this problem, with the ADSP services each would use and the trade-offs compared with the current approach.';

const Alternative: FunctionComponent<{ match: PatternMatch; pattern?: BusinessPattern }> = ({ match, pattern }) => (
  <GoabContainer type="non-interactive" accent="thin" mb="m" testId={`alternative-${match.patternId}`}>
    <h3>
      {match.patternName} <GoabBadge type={levelType[match.level]} content={match.level} />
    </h3>
    <p>{match.explanation}</p>
    {pattern && (
      <>
        <h4>Typical workflow</h4>
        <ul>
          {(pattern.commonFeatures || []).slice(0, 5).map((f) => (
            <li key={f}>{f}</li>
          ))}
        </ul>
        <h4>Services</h4>
        <ul>
          {pattern.serviceMappings.map((m) => (
            <li key={m.service}>
              <b>{m.service}</b>: {m.reason}
            </li>
          ))}
        </ul>
      </>
    )}
  </GoabContainer>
);

const OtherHypotheses: FunctionComponent<{ solution: Solution }> = ({ solution }) => (
  <>
    {solution.state.hypotheses.slice(1).map((h) => (
      <GoabContainer key={h.id} type="non-interactive" accent="thin" mb="m" testId={`alt-hypothesis-${h.id}`}>
        <h3>
          {h.title} <GoabBadge type="information" content={`${h.confidence} confidence`} />
        </h3>
        <p>{h.rationale}</p>
        <ul>
          {[...h.recommendations]
            .sort((a, b) => a.order - b.order)
            .map((r) => (
              <li key={r.service}>
                <b>{r.service}</b> — {r.reason}
              </li>
            ))}
        </ul>
      </GoabContainer>
    ))}
  </>
);

export const OptionExplorer: FunctionComponent<ModeProps> = (props) => {
  const { solution, api, mode, busy, run, layout, analysisModes, specialists, chatCounts, onChatsChanged, onSolutionChange } = props;
  const [patterns, setPatterns] = useState<BusinessPattern[]>([]);
  const [reply, setReply] = useState('');
  const { analysis, hypotheses, patternMatches = [], problemStatement } = solution.state;
  const top = hypotheses[0];

  useEffect(() => {
    api
      .listPatterns()
      .then((result) => setPatterns(result || []))
      .catch(() => setPatterns([]));
  }, [api]);

  const askAi = () =>
    run(async () => {
      const updated = await api.chat(solution.id, ALTERNATIVES_PROMPT, 'ai');
      onSolutionChange(updated);
      setReply([...(updated.state.conversation || [])].reverse().find((m) => m.role !== 'user')?.content || '');
    });

  const alternatives = patternMatches.slice(1, 4);
  const hasAlternatives = alternatives.length > 0 || hypotheses.length > 1;

  const current = (
    <div data-testid="current-approach">
      <h2>1. Current approach</h2>
      {analysis ? (
        <>
          <p>
            <strong>{top?.title || patternMatches[0]?.patternName || 'Initial solution'}</strong>
          </p>
          <p>{top?.rationale}</p>
        </>
      ) : (
        <p>Analyze the problem first (Rapid Recommend or Guided Discovery) to get a baseline to compare alternatives against.</p>
      )}
      <h3>Problem statement</h3>
      <p>{problemStatement || 'None'}</p>
    </div>
  );

  const alternativesPane = (
    <div data-testid="alternatives">
      <h2>3. Alternative workflows</h2>
      {analysis &&
        (hasAlternatives ? (
          <>
            {alternatives.map((m) => (
              <Alternative key={m.patternId} match={m} pattern={patterns.find((p) => p.id === m.patternId || p.name === m.patternName)} />
            ))}
            <OtherHypotheses solution={solution} />
          </>
        ) : (
          <p>No other strong patterns matched.</p>
        ))}
      <GoabButton type="primary" testId="alternatives-ai" disabled={busy || !analysis || !analysisModes.includes('ai')} onClick={askAi}>
        {busy ? 'Thinking…' : 'Ask AI for more alternatives'}
      </GoabButton>
      {busy && <GoabCircularProgress visible size="small" message="Asking the model — this can take up to a minute" />}
      {reply && (
        <GoabCallout type="information" heading="AI-suggested alternatives" testId="alternatives-reply">
          <div style={{ whiteSpace: 'pre-wrap' }}>{reply}</div>
        </GoabCallout>
      )}
    </div>
  );

  return (
    <PaneLayout
      layout={layout}
      panes={[
        { id: 1, node: current },
        { id: 2, node: <QuestionsPane {...props} title="2. Questions" /> },
        { id: 3, node: alternativesPane },
        {
          id: 5,
          node: (
            <SpecialistRail
              title="5. Consult a specialist"
              solution={solution}
              api={api}
              mode={mode}
              specialists={specialists}
              chatCounts={chatCounts}
              onChatsChanged={onChatsChanged}
            />
          ),
        },
      ]}
    />
  );
};

export default OptionExplorer;
