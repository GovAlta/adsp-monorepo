import React, { FunctionComponent, useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  GoabBadge,
  GoabButton,
  GoabCallout,
  GoabCircularProgress,
  GoabContainer,
  GoabDetails,
  GoabFormItem,
  GoabTable,
  GoabTextArea,
} from '@abgov/react-components';
import { Page, Main } from '@components/Html';
import { NoPaddingH2 } from '@components/AppHeader';
import { usePlannerApi } from './api';
import { ConsultResult, Solution } from './model';

const confidenceType = { high: 'success', medium: 'information', low: 'important' } as const;

export const SolutionDetail: FunctionComponent = () => {
  const { id } = useParams();
  const api = usePlannerApi();
  const navigate = useNavigate();
  const [solution, setSolution] = useState<Solution>();
  const [problem, setProblem] = useState('');
  const [consult, setConsult] = useState<ConsultResult>();

  const load = useCallback(() => {
    api
      .getSolution(id)
      .then((s) => {
        setSolution(s);
        setProblem(s.state.problemStatement);
      })
      .catch(() => navigate('../solutions'));
  }, [api, id, navigate]);

  useEffect(load, [load]);

  const update = (promise: Promise<Solution>) => promise.then(setSolution).catch(() => undefined);

  if (!solution) {
    return (
      <Page>
        <Main>
          <GoabCircularProgress visible message="Loading solution..." size="small" />
        </Main>
      </Page>
    );
  }

  const { state } = solution;
  const progressFor = (service: string) => state.specialists.find((s) => s.service === service)?.status || 'not-started';

  return (
    <Page>
      <Main>
        <GoabButton size="compact" type="tertiary" leadingIcon="arrow-back" testId="back-to-solutions" onClick={() => navigate('../solutions')}>
          Back to solutions
        </GoabButton>
        <h1 data-testid="solution-title">{solution.name}</h1>

        <NoPaddingH2>Problem</NoPaddingH2>
        <GoabFormItem label="Problem statement" mb="m">
          <GoabTextArea
            name="problem"
            value={problem}
            width="100%"
            rows={5}
            testId="solution-problem"
            aria-label="problem statement"
            onChange={(detail) => setProblem(detail.value)}
          />
        </GoabFormItem>
        <GoabButton size="compact" testId="analyze-solution" disabled={!problem.trim()} onClick={() => update(api.analyze(solution.id, problem))}>
          Analyze
        </GoabButton>

        <NoPaddingH2>Recommendations</NoPaddingH2>
        {state.hypotheses.length === 0 && (
          <GoabCallout type="information" heading="No recommendations yet">
            Describe the problem and select Analyze to generate solution hypotheses.
          </GoabCallout>
        )}
        {state.hypotheses.map((hypothesis) => (
          <GoabContainer key={hypothesis.id} accent="thin" mb="l" heading={hypothesis.title}
            actions={<GoabBadge type={confidenceType[hypothesis.confidence]} content={`${hypothesis.confidence} confidence`} icon={false} />}>
            <p>{hypothesis.rationale}</p>
            <GoabTable width="100%" testId={`recommendations-${hypothesis.id}`}>
              <thead>
                <tr>
                  <th>Service</th>
                  <th>Why</th>
                  <th>Progress</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {hypothesis.recommendations.map((rec) => (
                  <tr key={rec.service}>
                    <td>{rec.service}</td>
                    <td>{rec.reason}</td>
                    <td>{progressFor(rec.service)}</td>
                    <td>
                      <GoabButton size="compact" type="tertiary" testId={`consult-${rec.service}`} onClick={() => api.consult(solution.id, rec.service).then(setConsult).then(load)}>
                        Consult
                      </GoabButton>
                      <GoabButton
                        size="compact"
                        type="tertiary"
                        testId={`handoff-${rec.service}`}
                        onClick={() => api.handoff(solution.id, rec.service).then((r) => navigate(r.workspacePath))}
                      >
                        Open workspace
                      </GoabButton>
                    </td>
                  </tr>
                ))}
              </tbody>
            </GoabTable>
            <GoabDetails heading="Assumptions and unknowns">
              <ul>
                {hypothesis.assumptions.map((a) => (
                  <li key={a}>Assumption: {a}</li>
                ))}
                {hypothesis.unknowns.map((u) => (
                  <li key={u}>To validate: {u}</li>
                ))}
              </ul>
            </GoabDetails>
          </GoabContainer>
        ))}

        {consult && (
          <GoabCallout type="information" heading={`${consult.service}: ${consult.fit}`} testId="consult-result">
            <p>{consult.reason}</p>
            <ul>
              {consult.questions.map((q) => (
                <li key={q}>{q}</li>
              ))}
              {consult.dependencies.map((d) => (
                <li key={d.service}>
                  Depends on {d.service} ({d.satisfied ? 'in plan' : 'not in plan'})
                </li>
              ))}
              {consult.risks.map((r) => (
                <li key={r}>Risk: {r}</li>
              ))}
            </ul>
          </GoabCallout>
        )}

        <NoPaddingH2>Open questions</NoPaddingH2>
        {state.questions.filter((q) => q.status === 'open').length === 0 ? (
          <p>No open questions.</p>
        ) : (
          <ul data-testid="open-questions">
            {state.questions
              .filter((q) => q.status === 'open')
              .map((q) => (
                <li key={q.id}>{q.question}</li>
              ))}
          </ul>
        )}

        <NoPaddingH2>Business model</NoPaddingH2>
        {state.concepts.length === 0 ? (
          <p>No concepts captured yet.</p>
        ) : (
          <GoabTable width="100%" testId="concepts-table">
            <thead>
              <tr>
                <th>Type</th>
                <th>Name</th>
                <th>Source</th>
              </tr>
            </thead>
            <tbody>
              {state.concepts.map((c) => (
                <tr key={c.id}>
                  <td>{c.type}</td>
                  <td>{c.name}</td>
                  <td>{c.source}</td>
                </tr>
              ))}
            </tbody>
          </GoabTable>
        )}

        <NoPaddingH2>Decisions</NoPaddingH2>
        {state.decisions.length === 0 ? (
          <p>No decisions recorded.</p>
        ) : (
          <ul>
            {state.decisions.map((d) => (
              <li key={d.id}>
                <strong>{d.title}</strong>: {d.decision} — {d.reason}
              </li>
            ))}
          </ul>
        )}

        <NoPaddingH2>Next steps</NoPaddingH2>
        <ul data-testid="next-steps">
          {state.nextSteps.map((step) => (
            <li key={step.title}>
              {step.title}. {step.reason}
            </li>
          ))}
        </ul>
      </Main>
    </Page>
  );
};
