import React, { FunctionComponent } from 'react';
import { GoabAccordion, GoabBadge, GoabDetails, GoabTable } from '@abgov/react-components';
import BlueprintViewer from './BlueprintViewer';
import { ConfidenceLevel, Hypothesis, Solution } from './model';
import { PaneProps } from './workplaceTypes';

const levelType: Record<ConfidenceLevel, 'success' | 'important' | 'information'> = {
  high: 'success',
  medium: 'important',
  low: 'information',
};

const List: FunctionComponent<{ items: React.ReactNode[]; empty?: string }> = ({ items, empty = 'None' }) =>
  items.length ? (
    <ul>
      {items.map((item, i) => (
        <li key={i}>{item}</li>
      ))}
    </ul>
  ) : (
    <p>{empty}</p>
  );

const HypothesisView: FunctionComponent<{ hypothesis: Hypothesis; open: boolean }> = ({ hypothesis: h, open }) => (
  <GoabAccordion heading={h.title} secondaryText={`${h.confidence} confidence`} open={open} headingSize="small" testId={`hypothesis-${h.id}`}>
    <p>{h.rationale}</p>
    <h3>Recommended services</h3>
    <List
      items={[...h.recommendations]
        .sort((a, b) => a.order - b.order)
        .map((r) => (
          <>
            <strong>
              {r.order}. {r.service}
            </strong>{' '}
            — {r.reason}
          </>
        ))}
    />
    <h3>Assumptions</h3>
    <List items={h.assumptions} />
    <h3>Unknowns</h3>
    <List items={h.unknowns} />
  </GoabAccordion>
);

const Hypotheses: FunctionComponent<{ solution: Solution; open: boolean }> = ({ solution, open }) =>
  solution.state.hypotheses.length ? (
    <>
      {solution.state.hypotheses.map((h, i) => (
        <HypothesisView key={h.id} hypothesis={h} open={open && i === 0} />
      ))}
    </>
  ) : (
    <p>Run an analysis to see solution hypotheses.</p>
  );

const Concepts: FunctionComponent<{ solution: Solution }> = ({ solution }) =>
  solution.state.concepts.length ? (
    <GoabTable width="100%" testId="concepts-table">
      <thead>
        <tr>
          <th>Type</th>
          <th>Name</th>
          <th>Source</th>
        </tr>
      </thead>
      <tbody>
        {solution.state.concepts.map((c) => (
          <tr key={c.id}>
            <td>
              <GoabBadge type="information" content={c.type} />
            </td>
            <td>{c.name}</td>
            <td>{c.source}</td>
          </tr>
        ))}
      </tbody>
    </GoabTable>
  ) : (
    <p>No concepts yet.</p>
  );

const NextSteps: FunctionComponent<{ solution: Solution }> = ({ solution }) => (
  <List
    empty="Run an analysis to get next steps."
    items={solution.state.nextSteps.map((n) => (
      <>
        <strong>{n.title}</strong> {n.service && <GoabBadge type="information" content={n.service} />} — {n.reason}
      </>
    ))}
  />
);

const PatternMatches: FunctionComponent<{ solution: Solution }> = ({ solution }) => {
  const matches = solution.state.patternMatches || [];
  return matches.length ? (
    <GoabTable width="100%" testId="pattern-matches-table">
      <thead>
        <tr>
          <th>Pattern</th>
          <th>Score</th>
          <th>Confidence</th>
          <th>Why</th>
        </tr>
      </thead>
      <tbody>
        {matches.map((m) => (
          <tr key={m.patternId}>
            <td>{m.patternName}</td>
            <td>{m.score}</td>
            <td>
              <GoabBadge type={levelType[m.level]} content={m.level} />
            </td>
            <td>{m.explanation}</td>
          </tr>
        ))}
      </tbody>
    </GoabTable>
  ) : (
    <p>Not analyzed yet.</p>
  );
};

interface ProposedSolutionProps extends PaneProps {
  title: string;
  /** Open the detail sections by default (compressed view). Closed by default otherwise. */
  open?: boolean;
}

export const ProposedSolution: FunctionComponent<ProposedSolutionProps> = ({
  solution,
  api,
  mode,
  busy,
  onSolutionChange,
  title,
  open = false,
}) => (
  <div data-testid="proposed-solution">
    <h2>{title}</h2>
    {solution.state.hypotheses.length > 0 || solution.state.analysis ? (
      <>
        <GoabDetails heading="Hypotheses" open={open} testId="section-hypotheses">
          <Hypotheses solution={solution} open={open} />
        </GoabDetails>
        <GoabDetails heading="Concepts" open={open} testId="section-concepts">
          <Concepts solution={solution} />
        </GoabDetails>
        <GoabDetails heading="Next steps" open={open} testId="section-steps">
          <NextSteps solution={solution} />
        </GoabDetails>
        <GoabDetails heading="Pattern matches" open={open} testId="section-patterns">
          <PatternMatches solution={solution} />
        </GoabDetails>
        <h3>Project blueprint</h3>
        <BlueprintViewer solution={solution} api={api} mode={mode} busy={busy} onSolutionChange={onSolutionChange} />
      </>
    ) : (
      <p>Analyze the problem to see the proposed solution.</p>
    )}
  </div>
);

export default ProposedSolution;
