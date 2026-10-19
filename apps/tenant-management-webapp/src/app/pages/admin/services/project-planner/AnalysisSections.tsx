import React, { FunctionComponent } from 'react';
import { GoabAccordion, GoabBadge, GoabTable } from '@abgov/react-components';
import styled from 'styled-components';
import { ConfidenceLevel, Hypothesis, Solution } from './model';

const levelType: Record<ConfidenceLevel, 'success' | 'important' | 'information'> = {
  high: 'success',
  medium: 'important',
  low: 'information',
};

const ItemList = styled.ul`
  li + li {
    margin-top: 0.5rem;
  }
`;

const List: FunctionComponent<{ items: React.ReactNode[]; empty?: string }> = ({ items, empty = 'None' }) =>
  items.length ? (
    <ItemList>
      {items.map((item, i) => (
        <li key={i}>{item}</li>
      ))}
    </ItemList>
  ) : (
    <p>{empty}</p>
  );

const HypothesisView: FunctionComponent<{ hypothesis: Hypothesis; open: boolean }> = ({ hypothesis: h, open }) => (
  <GoabAccordion
    heading={h.title}
    secondaryText={`${h.confidence} confidence`}
    open={open}
    headingSize="small"
    testId={`hypothesis-${h.id}`}
  >
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

export const Hypotheses: FunctionComponent<{ solution: Solution; open: boolean }> = ({ solution, open }) =>
  solution.state.hypotheses.length ? (
    <>
      {solution.state.hypotheses.map((h, i) => (
        <HypothesisView key={h.id} hypothesis={h} open={open && i === 0} />
      ))}
    </>
  ) : (
    <p>Run an analysis to see solution hypotheses.</p>
  );

export const Concepts: FunctionComponent<{ solution: Solution }> = ({ solution }) =>
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

export const NextSteps: FunctionComponent<{ solution: Solution }> = ({ solution }) => (
  <List
    empty="Run an analysis to get next steps."
    items={solution.state.nextSteps.map((n) => (
      <>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
          <strong>{n.title}</strong>
          {n.service && <GoabBadge type="information" content={n.service} />}
        </span>{' '}
        — {n.reason}
      </>
    ))}
  />
);

export const PatternMatches: FunctionComponent<{ solution: Solution }> = ({ solution }) => {
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
