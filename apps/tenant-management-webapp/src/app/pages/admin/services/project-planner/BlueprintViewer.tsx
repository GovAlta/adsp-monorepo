import React, { FunctionComponent, ReactNode, useEffect } from 'react';
import {
  GoabAccordion,
  GoabBadge,
  GoabButton,
  GoabCallout,
  GoabCircularProgress,
  GoabContainer,
  GoabDropdown,
  GoabDropdownItem,
  GoabTable,
} from '@abgov/react-components';
import { PlannerApi } from './api';
import { AnalysisMode, ComponentReview, Solution } from './model';
import { useBusy } from './useBusy';
import {
  acceptanceGroups,
  acceptanceModeLabel,
  acceptanceSentence,
  NO_ACCEPTANCE_CRITERIA,
  REGENERATE_FOR_ACCEPTANCE,
  REVIEW_LABELS,
} from './utils';

interface BlueprintViewerProps {
  solution: Solution;
  api: PlannerApi;
  mode: AnalysisMode;
  busy?: boolean;
  onSolutionChange: (solution: Solution) => void;
  allOpen?: boolean;
  showControls?: boolean;
  onBusyChange?: (busy: boolean) => void;
}

const SubList: FunctionComponent<{ title: string; items?: string[] }> = ({ title, items }) =>
  items?.length ? (
    <>
      <h4>{title}</h4>
      <ul>
        {items.map((item, i) => (
          <li key={i} style={{ whiteSpace: 'pre-wrap' }}>
            {item}
          </li>
        ))}
      </ul>
    </>
  ) : null;

const formatDate = (value: string) => new Date(value).toLocaleString();

const plural = (count: number, word: string) => `${count} ${word}${count === 1 ? '' : 's'}`;

export const BlueprintViewer: FunctionComponent<BlueprintViewerProps> = ({
  solution,
  api,
  mode,
  busy,
  onSolutionChange,
  allOpen = false,
  showControls = true,
  onBusyChange,
}) => {
  const [running, run] = useBusy();
  const { blueprint, analysis, hypotheses } = solution.state;
  const working = running || !!busy;

  useEffect(() => {
    onBusyChange?.(running);
  }, [running, onBusyChange]);

  const generate = (refreshConsultations: boolean) =>
    run(async () => onSolutionChange(await api.blueprint(solution.id, { mode, refreshConsultations })));
  const review = (order: number, value: ComponentReview) =>
    run(async () => onSolutionChange(await api.reviewComponent(solution.id, order, value)));

  if (!hypotheses.length) {
    return (
      <p data-testid="blueprint-unavailable">
        Analyze the problem first; the blueprint is built from the proposed solution.
      </p>
    );
  }

  const controls = (
    <>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: '0.75rem' }}>
        <GoabButton
          type={blueprint ? 'secondary' : 'primary'}
          size="compact"
          testId="blueprint-generate"
          disabled={working}
          onClick={() => generate(false)}
        >
          {running ? 'Generating…' : blueprint ? 'Regenerate blueprint' : 'Generate blueprint'}
        </GoabButton>
        {blueprint && (
          <GoabButton
            type="tertiary"
            size="compact"
            testId="blueprint-refresh"
            disabled={working}
            onClick={() => generate(true)}
          >
            Regenerate with fresh specialist consultations
          </GoabButton>
        )}
      </div>
      {running && (
        <GoabCircularProgress
          visible
          size="small"
          message="Consulting the recommended specialists and drafting the blueprint — this can take a few minutes"
        />
      )}
    </>
  );

  if (!blueprint) {
    return (
      <div data-testid="blueprint-viewer">
        <p>
          The blueprint turns the proposed solution into a complete plan: project overview, technical architecture, ADSP
          service mapping, requirements not covered by ADSP, the components to set up, consolidated specialist
          consultation notes, core workflows, data and governance, a delivery plan, and acceptance criteria.
        </p>
        {controls}
      </div>
    );
  }

  const { overview: o, architecture: a, dataGovernance: d, delivery: dl } = blueprint;
  const components = blueprint.components ?? [];
  const toReview = components.filter((c) => (c.review ?? 'not-reviewed') === 'not-reviewed').length;

  const section = (id: string, heading: string, children: ReactNode, headingContent?: ReactNode) => (
    <GoabAccordion
      heading={heading}
      open={allOpen}
      maxWidth="100%"
      headingContent={headingContent}
      testId={`blueprint-section-${id}`}
    >
      {children}
    </GoabAccordion>
  );

  return (
    <div data-testid="blueprint-viewer">
      {showControls && controls}
      <p data-testid="blueprint-generated">Plan created {formatDate(blueprint.generatedOn)}</p>
      {!working && blueprint.warning && (
        <GoabCallout type="important" heading="Note" mt="m" testId="blueprint-warning">
          {blueprint.warning}
        </GoabCallout>
      )}

      {section(
        'overview',
        '1. Project blueprint',
        <>
          <h3>{o.title}</h3>
          <p>{o.summary}</p>
          <SubList title="Objectives" items={o.objectives} />
          <SubList title="Scope" items={o.scope} />
          <SubList title="Out of scope" items={o.outOfScope} />
          <SubList title="Stakeholders" items={o.stakeholders} />
          <SubList title="Success measures" items={o.successMeasures} />
          <SubList title="Key risks" items={o.risks} />
        </>,
      )}

      {section(
        'architecture',
        '2. Technical architecture',
        <>
          <p>{a.summary}</p>
          <GoabTable width="100%" testId="blueprint-layers">
            <thead>
              <tr>
                <th>Layer</th>
                <th>Purpose</th>
                <th>Components</th>
              </tr>
            </thead>
            <tbody>
              {a.layers.map((layer) => (
                <tr key={layer.name}>
                  <td>
                    <strong>{layer.name}</strong>
                  </td>
                  <td>{layer.description}</td>
                  <td>{layer.components.join(', ')}</td>
                </tr>
              ))}
            </tbody>
          </GoabTable>
          <pre
            role="img"
            aria-label="Architecture diagram"
            tabIndex={0}
            style={{ overflow: 'auto', fontSize: '0.8rem' }}
          >
            {a.diagram}
          </pre>
          <SubList title="Integrations" items={a.integrations} />
          <SubList title="Security" items={a.security} />
        </>,
      )}

      {section(
        'services',
        '3. ADSP service mapping',
        <GoabTable width="100%" testId="blueprint-services">
          <thead>
            <tr>
              <th>#</th>
              <th>Service</th>
              <th>Role in this solution</th>
              <th>Why</th>
              <th>Depends on</th>
            </tr>
          </thead>
          <tbody>
            {blueprint.serviceMapping.map((s) => (
              <tr key={s.service}>
                <td>{s.order}</td>
                <td>
                  <strong>{s.service}</strong>
                </td>
                <td>
                  {s.role}
                  {s.capabilities.length > 0 && (
                    <ul>
                      {s.capabilities.map((c) => (
                        <li key={c}>{c}</li>
                      ))}
                    </ul>
                  )}
                </td>
                <td>{s.reason}</td>
                <td>{s.dependsOn.join(', ') || '—'}</td>
              </tr>
            ))}
          </tbody>
        </GoabTable>,
      )}

      {blueprint.notCoveredByAdsp !== undefined &&
        section(
          'not-covered',
          '4. Not covered by ADSP',
          blueprint.notCoveredByAdsp.length === 0 ? (
            <p>All requirements map to ADSP services.</p>
          ) : (
            <GoabTable width="100%" testId="blueprint-not-covered">
              <thead>
                <tr>
                  <th>Requirement</th>
                  <th>Why it's not covered</th>
                  <th>Suggested approach</th>
                </tr>
              </thead>
              <tbody>
                {blueprint.notCoveredByAdsp.map((n, i) => (
                  <tr key={i}>
                    <td>
                      <strong>{n.requirement}</strong>
                    </td>
                    <td>{n.reason}</td>
                    <td>{n.suggestedApproach}</td>
                  </tr>
                ))}
              </tbody>
            </GoabTable>
          ),
        )}

      {section(
        'components',
        '5. Components to set up',
        <GoabTable width="100%" testId="blueprint-components">
          <thead>
            <tr>
              <th>#</th>
              <th>Component</th>
              <th>Service</th>
              <th>Purpose</th>
              <th>Where and how</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {components.map((c) => (
              <tr key={`${c.service}-${c.name}`}>
                <td>{c.order}</td>
                <td>
                  <strong>{c.name}</strong>
                  <div>{c.type}</div>
                </td>
                <td>{c.service}</td>
                <td>
                  {c.purpose}
                  <SubList title="Open decisions" items={c.openDecisions} />
                </td>
                <td>
                  <div>{c.setup.where}</div>
                  <div>{c.setup.how}</div>
                  {c.dependsOn.length > 0 && <div>Depends on: {c.dependsOn.join(', ')}</div>}
                  <a href={c.setup.docs} rel="noopener noreferrer" target="_blank">
                    Docs
                  </a>
                </td>
                <td>
                  <GoabDropdown
                    name={`component-review-${c.order}`}
                    value={c.review ?? 'not-reviewed'}
                    size="compact"
                    width="9rem"
                    ariaLabel={`Review status for ${c.name}`}
                    disabled={working}
                    testId={`component-review-${c.order}`}
                    onChange={(detail) => review(c.order, detail.value as ComponentReview)}
                  >
                    {Object.entries(REVIEW_LABELS).map(([value, label]) => (
                      <GoabDropdownItem key={value} value={value} label={label} />
                    ))}
                  </GoabDropdown>
                </td>
              </tr>
            ))}
          </tbody>
        </GoabTable>,
        toReview > 0 && (
          <GoabBadge
            type="important"
            content={`${plural(toReview, 'component')} to review`}
            testId="blueprint-components-to-review"
          />
        ),
      )}

      {section(
        'notes',
        '6. Specialist consultation notes',
        blueprint.specialistNotes.length === 0 ? (
          <p>No recommended services.</p>
        ) : (
          blueprint.specialistNotes.map((n) => (
            <GoabContainer key={n.service} type="non-interactive" accent="thin" testId={`blueprint-note-${n.service}`}>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                <strong>{n.displayName}</strong>
                <GoabBadge type={n.fit === 'recommended' ? 'success' : 'information'} content={n.fit} />
                <GoabBadge type="information" content={n.source.replace('-', ' ')} />
                <span>{formatDate(n.consultedOn)}</span>
              </div>
              <div style={{ whiteSpace: 'pre-wrap' }}>{n.summary}</div>
              <SubList title="Can support" items={n.supports} />
              <SubList title="Constraints" items={n.constraints} />
              <SubList title="Questions to resolve" items={n.questions} />
              <SubList title="Risks" items={n.risks} />
              {n.validation && <SubList title={`Validation: ${n.validation.verdict}`} items={n.validation.findings} />}
              <SubList title="From saved chats" items={n.chatHighlights} />
            </GoabContainer>
          ))
        ),
      )}

      {section(
        'workflows',
        '7. Core workflows',
        blueprint.workflows.map((w) => (
          <div key={w.name}>
            <h4>{w.name}</h4>
            {w.actors.length > 0 && <p>Actors: {w.actors.join(', ')}</p>}
            <ol>
              {w.steps.map((step, i) => (
                <li key={i}>{step}</li>
              ))}
            </ol>
          </div>
        )),
      )}

      {section(
        'governance',
        '8. Data & governance',
        <>
          <SubList title="Data entities" items={d.dataEntities} />
          <SubList title="Access control" items={d.accessControl} />
          <SubList title="Retention" items={d.retention} />
          <SubList title="Privacy" items={d.privacy} />
          <SubList title="Audit" items={d.audit} />
          <SubList title="Compliance" items={d.compliance} />
        </>,
      )}

      {section(
        'delivery',
        '9. Delivery plan & other considerations',
        <>
          {dl.phases.map((phase) => (
            <SubList key={phase.name} title={phase.name} items={phase.items} />
          ))}
          <SubList title="Non-functional requirements" items={dl.nonFunctional} />
          <SubList title="Open questions" items={dl.openQuestions} />
        </>,
      )}

      {section(
        'acceptance',
        '10. Acceptance criteria',
        !blueprint.acceptance ? (
          <p>{REGENERATE_FOR_ACCEPTANCE}</p>
        ) : (
          <>
            <p>{acceptanceModeLabel(blueprint.acceptance)}</p>
            {blueprint.acceptance.criteria.length === 0 ? (
              <p>{NO_ACCEPTANCE_CRITERIA}</p>
            ) : (
              acceptanceGroups(blueprint.acceptance.criteria).map(([group, criteria]) => (
                <div key={group}>
                  <h4>{group}</h4>
                  <ul>
                    {criteria.map((c) => (
                      <li key={c.id}>
                        <strong>{c.id}</strong>
                        {c.actor && ` (${c.actor})`}: {acceptanceSentence(c)} <em>Source:</em> {c.source}
                      </li>
                    ))}
                  </ul>
                </div>
              ))
            )}
          </>
        ),
      )}
    </div>
  );
};

export default BlueprintViewer;
