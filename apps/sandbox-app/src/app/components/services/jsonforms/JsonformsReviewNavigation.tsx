// clean-code-ignore: RULE-19 — covered by ./JsonformsReviewNavigation.spec.tsx.
//
// Reproduction page for "the review's Change button does not go to the step/page".
//
// It runs the real CDRT application schemas (./condoTribunal) in the two shapes that matter, side
// by side against one shared data object:
//
//   the form     — the pages stepper, including its own last-page review summary. Change there has
//                  a stepper in context, so it moves the page directly.
//   the review   — the same summary rendered on its own, the way a host application shows it. There
//                  is no stepper in context, so the only thing a Change click can do is report
//                  itself through onReviewChange; this page turns that report into a navigation
//                  target and hands it to the form above.
//
// Every click is logged with what the review reported and what the form resolved it to, so a click
// that goes nowhere can be attributed to one side or the other rather than guessed at.
import { useCallback, useMemo, useState } from 'react';
import { GoabButton, GoabButtonGroup, GoabCallout, GoabContainer, GoabTable, GoabText } from '@abgov/react-components';
import {
  ContextProviderFactory,
  createDefaultAjv,
  getNavigationTargets,
  GoACells,
  GoARenderers,
  GoAReviewRenderers,
  NavigationOutcome,
  NavigationTarget,
  ReviewRenderProvider,
} from '@abgov/jsonforms-components';
import { JsonForms } from '@jsonforms/react';
import { ServiceContainer } from '../../styled-components';
import { condoTribunalDataSchema, condoTribunalUiSchema, sampleApplication } from './condoTribunal';

const ContextProvider = ContextProviderFactory();

interface ClickLogEntry {
  at: string;
  reported: { stepId: number | undefined; scope: string };
  outcome?: NavigationOutcome;
}

const describeOutcome = (outcome?: NavigationOutcome): string => {
  if (!outcome) {
    return 'form has not answered yet';
  }

  switch (outcome.status) {
    case 'navigated':
      return `navigated to ${outcome.pageId}`;
    case 'unavailable':
      return `${outcome.pageId} unavailable (${outcome.reason})`;
    default:
      return `unknown target ${JSON.stringify(outcome.requested)}`;
  }
};

export const JsonformsReviewNavigation = (): JSX.Element => {
  const ajv = useMemo(() => createDefaultAjv(), []);
  const [formData, setFormData] = useState<Record<string, unknown>>(sampleApplication);
  const [navigationTarget, setNavigationTarget] = useState<NavigationTarget>();
  const [log, setLog] = useState<ClickLogEntry[]>([]);

  // What the definition says a host is allowed to address. Rendering it here makes the page ids the
  // review is reporting against visible, rather than something to infer from the behaviour.
  const navigationTargets = useMemo(() => getNavigationTargets(condoTribunalUiSchema), []);

  const handleFormChange = useCallback(({ data }: { data: Record<string, unknown> }) => setFormData(data), []);

  // The host half: a Change click arrives as a step index and a scope, and becomes a target the
  // form is asked to honour. A page id is used where the review knew the step, so the case where
  // only the scope survives is still exercised by the fields the review reports without one.
  const handleReviewChange = useCallback(
    (stepId: number | undefined, scope: string) => {
      const pageId = stepId === undefined ? undefined : navigationTargets[stepId]?.pageId;
      setLog((entries) => [{ at: new Date().toLocaleTimeString(), reported: { stepId, scope } }, ...entries]);
      setNavigationTarget({ pageId, scope });
    },
    [navigationTargets],
  );

  // The request is cleared once the form has answered it. A target left standing is treated as
  // already applied, so without this a second click on the same Change button — after the user has
  // walked back to the overview themselves — would be indistinguishable from a re-render and would
  // go nowhere.
  const handleNavigationChange = useCallback((outcome: NavigationOutcome) => {
    setLog((entries) => (entries.length === 0 ? entries : [{ ...entries[0], outcome }, ...entries.slice(1)]));
    setNavigationTarget(undefined);
  }, []);

  const handleReset = useCallback(() => {
    setFormData(sampleApplication);
    setNavigationTarget(undefined);
    setLog([]);
  }, []);

  return (
    <ServiceContainer>
      <GoabContainer
        accent="thick"
        type="non-interactive"
        width="full"
        testId="JsonformsReviewNavigationContainer"
        heading="Review change navigation (CDRT application)"
      >
        <GoabText size="body-m">
          The condominium tribunal application, in the two shapes a Change button has to work in. The form below is the
          pages stepper; the summary further down is the same review rendered on its own, as a host application shows
          it. Both read and write the same data, so a change made in either is visible in the other.
        </GoabText>

        <GoabCallout type="information" heading="What to watch" mt="m" mb="m">
          A Change click in the standalone summary reports a step index and a scope. Nothing else about it reaches the
          form — the log at the bottom shows what was reported and what the form resolved it to.
        </GoabCallout>

        <GoabButtonGroup alignment="start" mb="l">
          <GoabButton type="secondary" testId="reset-review-navigation" onClick={handleReset}>
            Reset the data and log
          </GoabButton>
        </GoabButtonGroup>

        <h3>The form</h3>
        <ContextProvider
          showChangeButtons={true}
          navigationTarget={navigationTarget}
          onNavigationChange={handleNavigationChange}
        >
          <JsonForms
            ajv={ajv}
            schema={condoTribunalDataSchema}
            uischema={condoTribunalUiSchema}
            data={formData}
            validationMode="ValidateAndShow"
            renderers={GoARenderers}
            cells={GoACells}
            onChange={handleFormChange}
          />
        </ContextProvider>

        <h3>The review, rendered on its own</h3>
        <GoabText size="body-m" mb="m">
          No stepper is in context here, so a Change button has nothing of its own to move. Everything it can do is in
          the report it makes.
        </GoabText>
        <ContextProvider showChangeButtons={true}>
          <ReviewRenderProvider onReviewChange={handleReviewChange}>
            <JsonForms
              readonly={true}
              ajv={ajv}
              schema={condoTribunalDataSchema}
              uischema={condoTribunalUiSchema}
              data={formData}
              validationMode="NoValidation"
              renderers={GoAReviewRenderers}
              cells={GoACells}
            />
          </ReviewRenderProvider>
        </ContextProvider>

        <h3>What the definition offers a host</h3>
        <GoabText size="body-m" mb="m">
          The pages a link can address, in the order the review reports them by index. None of this form's pages carry
          an authored <code>options.id</code>, so every one of them is addressed positionally.
        </GoabText>
        <GoabTable width="100%" mb="l">
          <thead>
            <tr>
              <th>Index</th>
              <th>Page id</th>
              <th>Label</th>
            </tr>
          </thead>
          <tbody>
            {navigationTargets.map(({ index, pageId, label }) => (
              <tr key={pageId} data-testid={`navigation-target-${pageId}`}>
                <td>{index}</td>
                <td>
                  <code>{pageId}</code>
                </td>
                <td>{label ?? '(no label)'}</td>
              </tr>
            ))}
          </tbody>
        </GoabTable>

        <h3>Change clicks</h3>
        {log.length === 0 ? (
          <GoabText size="body-m" mb="l">
            Nothing yet. Click a Change button in the standalone summary.
          </GoabText>
        ) : (
          <GoabTable width="100%" mb="l">
            <thead>
              <tr>
                <th>Time</th>
                <th>Reported step</th>
                <th>Reported scope</th>
                <th>Form outcome</th>
              </tr>
            </thead>
            <tbody>
              {log.map((entry, index) => (
                <tr key={`${entry.at}-${index}`} data-testid="review-change-log-row">
                  <td>{entry.at}</td>
                  <td>{entry.reported.stepId === undefined ? '(none)' : entry.reported.stepId}</td>
                  <td>
                    <code>{entry.reported.scope || '(none)'}</code>
                  </td>
                  <td>{describeOutcome(entry.outcome)}</td>
                </tr>
              ))}
            </tbody>
          </GoabTable>
        )}
      </GoabContainer>
    </ServiceContainer>
  );
};
