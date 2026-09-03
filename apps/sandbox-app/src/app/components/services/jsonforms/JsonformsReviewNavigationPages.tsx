// clean-code-ignore: RULE-19 — covered by ./JsonformsReviewNavigationPages.spec.tsx.
//
// The other host shape: the summary and the form are separate routes of one application, so the
// form is unmounted while the user is looking at the summary and mounts fresh when they arrive.
//
// The sibling page (./JsonformsReviewNavigation.tsx) keeps both in one tree. That difference is not
// cosmetic, and it is the reason this page exists:
//
//   one tree     — the form is already mounted, so a Change click can only reach it through a
//                  context value that changes identity. That is what CS-5347 fixed.
//   two routes   — the form mounts with the target already in hand, so it never depended on that.
//                  What it depends on instead is the target outliving the route switch, which is
//                  why the state lives here, above the <Routes>, rather than on the summary page.
//
// Both end at the same `navigationTarget`, and the log below records what each click reported and
// what the form made of it, so the two pages can be compared directly.
import { useCallback, useMemo, useState } from 'react';
import { Navigate, Route, Routes, useNavigate, useParams } from 'react-router-dom';
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

interface PageProps {
  data: Record<string, unknown>;
  onDataChange: (data: Record<string, unknown>) => void;
}

const SummaryPage = ({
  data,
  onReviewChange,
}: {
  data: Record<string, unknown>;
  onReviewChange: (stepId: number | undefined, scope: string) => void;
}): JSX.Element => {
  const ajv = useMemo(() => createDefaultAjv(), []);

  return (
    <div data-testid="summary-route">
      <GoabText size="body-m" mb="m">
        A read-only summary. The form is not mounted at all while you are here — a Change button has nothing in this
        tree to move, so all it can do is report itself.
      </GoabText>
      <ContextProvider showChangeButtons={true}>
        <ReviewRenderProvider onReviewChange={onReviewChange}>
          <JsonForms
            readonly={true}
            ajv={ajv}
            schema={condoTribunalDataSchema}
            uischema={condoTribunalUiSchema}
            data={data}
            validationMode="NoValidation"
            renderers={GoAReviewRenderers}
            cells={GoACells}
          />
        </ReviewRenderProvider>
      </ContextProvider>
    </div>
  );
};

const FormPage = ({
  data,
  onDataChange,
  navigationTarget,
  onNavigationChange,
}: PageProps & {
  navigationTarget?: NavigationTarget;
  onNavigationChange: (outcome: NavigationOutcome) => void;
}): JSX.Element => {
  const ajv = useMemo(() => createDefaultAjv(), []);

  return (
    <div data-testid="form-route">
      <ContextProvider
        showChangeButtons={true}
        navigationTarget={navigationTarget}
        onNavigationChange={onNavigationChange}
      >
        <JsonForms
          ajv={ajv}
          schema={condoTribunalDataSchema}
          uischema={condoTribunalUiSchema}
          data={data}
          validationMode="ValidateAndShow"
          renderers={GoARenderers}
          cells={GoACells}
          onChange={({ data: next }) => onDataChange(next as Record<string, unknown>)}
        />
      </ContextProvider>
    </div>
  );
};

export const JsonformsReviewNavigationPages = (): JSX.Element => {
  const { tenant } = useParams<{ tenant: string }>();
  const navigate = useNavigate();
  const basePath = `/${tenant}/services/jsonforms/review-navigation-pages`;

  // Both of these live above the <Routes>. Held on the summary page they would be gone by the time
  // the form page mounted, which is the failure the guide warns about for this shape.
  const [formData, setFormData] = useState<Record<string, unknown>>(sampleApplication);
  const [navigationTarget, setNavigationTarget] = useState<NavigationTarget>();
  const [log, setLog] = useState<ClickLogEntry[]>([]);

  const navigationTargets = useMemo(() => getNavigationTargets(condoTribunalUiSchema), []);

  const handleReviewChange = useCallback(
    (stepId: number | undefined, scope: string) => {
      const pageId = stepId === undefined ? undefined : navigationTargets[stepId]?.pageId;
      setLog((entries) => [{ at: new Date().toLocaleTimeString(), reported: { stepId, scope } }, ...entries]);
      setNavigationTarget({ pageId, scope });
      navigate(`${basePath}/form`);
    },
    [basePath, navigate, navigationTargets],
  );

  // Clearing matters more here than it looks. The form remounts on every visit, so it would honour
  // whatever target is still standing — walk to the form by the link below with a stale one left
  // set, and it would drop you on the page you last asked for rather than where you left off.
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
        testId="JsonformsReviewNavigationPagesContainer"
        heading="Review change navigation across pages (CDRT application)"
      >
        <GoabText size="body-m">
          The same CDRT application as the single-page demo, split across two routes of this application. Clicking
          Change on the summary sets a target and switches route; the form mounts with that target already in hand.
        </GoabText>

        <GoabCallout type="information" heading="What to watch" mt="m" mb="m">
          Use the plain link to the form to see the difference: it carries no target, so it opens on the task list. A
          Change click opens the page that owns the answer.
        </GoabCallout>

        <GoabButtonGroup alignment="start" mb="l">
          <GoabButton type="secondary" testId="goto-summary" onClick={() => navigate(`${basePath}/summary`)}>
            Summary
          </GoabButton>
          <GoabButton type="secondary" testId="goto-form" onClick={() => navigate(`${basePath}/form`)}>
            The form, with no target
          </GoabButton>
          <GoabButton type="tertiary" testId="reset-review-navigation-pages" onClick={handleReset}>
            Reset the data and log
          </GoabButton>
        </GoabButtonGroup>

        <Routes>
          <Route path="summary" element={<SummaryPage data={formData} onReviewChange={handleReviewChange} />} />
          <Route
            path="form"
            element={
              <FormPage
                data={formData}
                onDataChange={setFormData}
                navigationTarget={navigationTarget}
                onNavigationChange={handleNavigationChange}
              />
            }
          />
          <Route path="*" element={<Navigate to={`${basePath}/summary`} replace />} />
        </Routes>

        <h3>Change clicks</h3>
        {log.length === 0 ? (
          <GoabText size="body-m" mb="l">
            Nothing yet. Click a Change button on the summary.
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
