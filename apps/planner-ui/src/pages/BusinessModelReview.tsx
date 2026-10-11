/**
 * BusinessModelReview — pageId: business-model-review, pageType: detail-view
 *
 * Shows the extracted business model with tabbed concept views (Actors, Processes, Systems).
 * Supports inline concept-type editing via GoADropdown — saved immediately via
 * PATCH /sessions/{sessionId}/model.
 *
 * FAC-S5-024: PATCH uses request body only — no Protected B data in URL query strings.
 * FAC-S5-026: No Protected B data written to localStorage, sessionStorage, or cookies.
 * ✓ ASVS:V-8.3.1 — businessModel fields rendered via MaskedField; no browser-storage write.
 * ✓ CAS:RULE-017 — ATIA s.23 deliberative content masked by default.
 *
 * TC-006, TC-021, TC-022, TC-025, TC-087 (UC-003)
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  GoAContainer,
  GoAButton,
  GoACallout,
  GoACircularProgress,
  GoADropdown,
  GoADropdownItem,
  GoAFormItem,
  GoATable,
} from '@abgov/react-components';
import { api } from '../services/api';
import type { BusinessModel, BusinessConcept, ConceptType } from '../services/api.types';
import MaskedField from '../components/MaskedField';
import ConfidenceBadge from '../components/ConfidenceBadge';

// ──────────────────────────────────────────────────────────────────────────────
// Constants
// ──────────────────────────────────────────────────────────────────────────────

type TabId = 'actors' | 'goals' | 'decisions' | 'systems' | 'other';
type ErrorKind = '404' | '403' | '409' | '503' | 'generic' | null;

/** Extend BusinessModel to include matchedPatternId from API response (not in base type). */
interface BusinessModelExtended extends BusinessModel {
  matchedPatternId?: string;
}

const ACTOR_TYPES: ConceptType[] = ['actor'];
const GOAL_TYPES: ConceptType[] = ['goal', 'activity', 'workflow', 'outcome', 'process'];
const DECISION_TYPES: ConceptType[] = ['decision', 'business_rule', 'constraint', 'evaluation_criteria'];
const SYSTEM_TYPES: ConceptType[] = ['system', 'external_system'];
const OTHER_TYPES: ConceptType[] = ['evidence', 'assumption', 'document', 'event', 'unknown', 'other'];

const ALL_CONCEPT_TYPES: ConceptType[] = [
  'actor',
  'goal',
  'activity',
  'decision',
  'evidence',
  'business_rule',
  'constraint',
  'evaluation_criteria',
  'workflow',
  'outcome',
  'document',
  'event',
  'external_system',
  'assumption',
  'unknown',
  'process',
  'system',
  'other',
];

const CONCEPT_TYPE_LABELS: Record<ConceptType, string> = {
  actor: 'Actor',
  goal: 'Goal',
  activity: 'Activity',
  decision: 'Decision',
  evidence: 'Evidence',
  business_rule: 'Business Rule',
  constraint: 'Constraint',
  evaluation_criteria: 'Evaluation Criteria',
  workflow: 'Workflow',
  outcome: 'Outcome',
  document: 'Document',
  event: 'Event',
  external_system: 'External System',
  assumption: 'Assumption',
  unknown: 'Unknown',
  process: 'Process',
  system: 'System',
  other: 'Other',
};

const TABS: { id: TabId; label: string }[] = [
  { id: 'actors', label: 'Actors' },
  { id: 'goals', label: 'Goals & Activities' },
  { id: 'decisions', label: 'Rules & Decisions' },
  { id: 'systems', label: 'Systems' },
  { id: 'other', label: 'Evidence & Other' },
];

const TAB_EMPTY_MESSAGES: Record<TabId, string> = {
  actors:
    'No Actor concepts have been identified yet. Continue your planning conversation and describe the people and organizations involved in your business problem.',
  goals:
    'No Goals, Activities, Workflows, or Outcomes have been identified yet. Continue describing your business objectives and key activities.',
  decisions:
    'No Decisions, Business Rules, or Constraints have been identified yet. Describe any approval steps, eligibility rules, or limitations.',
  systems:
    'No System concepts have been identified yet. Describe any technology systems, platforms, or external services involved.',
  other:
    'No Evidence, Assumptions, Documents, Events, or Unknown concepts have been identified yet.',
};

// ──────────────────────────────────────────────────────────────────────────────
// Component
// ──────────────────────────────────────────────────────────────────────────────

const BusinessModelReview: React.FC = () => {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();

  const [businessModel, setBusinessModel] = useState<BusinessModelExtended | null>(null);
  const [activeTab, setActiveTab] = useState<TabId>('actors');
  const [loading, setLoading] = useState(true);
  const [errorKind, setErrorKind] = useState<ErrorKind>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [editingConceptId, setEditingConceptId] = useState<string | null>(null);
  const [savingConceptId, setSavingConceptId] = useState<string | null>(null);

  // ── Load business model on mount ──────────────────────────────────────────

  useEffect(() => {
    if (!sessionId) return;
    setLoading(true);
    setErrorKind(null);
    setErrorMessage(null);
    api
      .getBusinessModel(sessionId)
      .then((data) => setBusinessModel(data as BusinessModelExtended))
      .catch((err: unknown) => {
        const status = (err as { response?: { status?: number } })?.response?.status;
        if (status === 404) {
          setErrorKind('404');
          setErrorMessage(
            'This planning session could not be found. It may have been archived or you may not have permission to access it.',
          );
        } else if (status === 403) {
          setErrorKind('403');
          setErrorMessage('You do not have permission to access this planning session.');
        } else {
          setErrorKind('generic');
          setErrorMessage(
            'An unexpected error occurred while loading the business model. Please try again.',
          );
        }
      })
      .finally(() => setLoading(false));
  }, [sessionId]);

  // ── Inline concept-type edit ──────────────────────────────────────────────
  // FAC-S5-024: conceptType value submitted via PATCH body, not URL query string

  const handleConceptTypeChange = useCallback(
    (_name: string, newType: string | string[]) => {
      if (!sessionId || !editingConceptId) return;
      const conceptType = Array.isArray(newType) ? newType[0] : newType;
      setSavingConceptId(editingConceptId);
      api
        .updateBusinessModel(sessionId, {
          conceptUpdates: [
            { conceptId: editingConceptId, conceptType: conceptType as ConceptType },
          ],
        })
        .then((updated) => {
          setBusinessModel(updated as BusinessModelExtended);
          setEditingConceptId(null);
        })
        .catch((err: unknown) => {
          const status = (err as { response?: { status?: number } })?.response?.status;
          if (status === 409) {
            setErrorKind('409');
            setErrorMessage(
              'The business model was updated by the Planning Agent while you were reviewing it. Please reload the page to see the latest version before making further corrections.',
            );
          } else if (status === 503) {
            setErrorKind('503');
            setErrorMessage(
              'The planning service is temporarily unavailable. Your changes have not been saved. Please try again in a moment.',
            );
          } else {
            setErrorKind('generic');
            setErrorMessage('Failed to save concept type change. Please try again.');
          }
        })
        .finally(() => setSavingConceptId(null));
    },
    [sessionId, editingConceptId],
  );

  // ── Navigation actions ────────────────────────────────────────────────────

  const handleConfirmBusinessModel = useCallback(() => {
    navigate(`/sessions/${sessionId}/hypothesis`);
  }, [sessionId, navigate]);

  const handleReturnToPlanning = useCallback(() => {
    navigate(`/sessions/${sessionId}/planning`);
  }, [sessionId, navigate]);

  const handleDownloadBusinessModel = useCallback(() => {
    if (!businessModel) return;
    const payload = JSON.stringify(businessModel, null, 2);
    const blob = new Blob([payload], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `business-model-${sessionId}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [businessModel, sessionId]);

  // ── Loading / fatal-error states ─────────────────────────────────────────

  if (loading) {
    return (
      <GoAContainer>
        <GoACircularProgress message="Loading business model..." />
      </GoAContainer>
    );
  }

  if (errorKind === '404' || errorKind === '403') {
    return (
      <GoAContainer>
        <GoACallout type="emergency" heading="Cannot access session">
          {errorMessage}
        </GoACallout>
        <GoAButton type="secondary" onClick={() => navigate('/sessions')}>
          Return to My Sessions
        </GoAButton>
      </GoAContainer>
    );
  }

  // ── Derived values ────────────────────────────────────────────────────────

  const score = businessModel?.confidenceScore ?? 0;
  const concepts = businessModel?.concepts ?? [];
  const tabConcepts: BusinessConcept[] = {
    actors: concepts.filter((c) => ACTOR_TYPES.includes(c.conceptType)),
    goals: concepts.filter((c) => GOAL_TYPES.includes(c.conceptType)),
    decisions: concepts.filter((c) => DECISION_TYPES.includes(c.conceptType)),
    systems: concepts.filter((c) => SYSTEM_TYPES.includes(c.conceptType)),
    other: concepts.filter((c) => OTHER_TYPES.includes(c.conceptType)),
  }[activeTab];
  const canConfirm = score >= 50 && concepts.length > 0;

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <GoAContainer>
      {/* Page heading — TC-006 */}
      <h1>Business Model</h1>

      <div className="business-model-review__heading-row">
        <span className="business-model-review__pattern">
          {businessModel?.matchedPatternId ??
            'No pattern matched yet. Continue refining your business problem description.'}
        </span>
        <ConfidenceBadge score={score} showLabel />
      </div>

      {/* Confidence-based callouts — TC-021 */}
      {score < 50 && (
        <GoACallout type="emergency" heading="Model confidence too low to proceed">
          Model confidence is too low to proceed. Return to the planning conversation to provide
          more context.
        </GoACallout>
      )}
      {score >= 50 && score < 70 && (
        <GoACallout type="important" heading="Moderate confidence">
          Model confidence is moderate. You can proceed, but adding more detail will improve
          hypothesis quality.
        </GoACallout>
      )}
      {score >= 70 && (
        <GoACallout type="success" heading="Ready to proceed">
          Your business model has sufficient confidence to generate a hypothesis.
        </GoACallout>
      )}
      {concepts.length === 0 && (
        <GoACallout type="information" heading="No concepts extracted yet">
          {/* TC-025 */}
          No business concepts have been extracted yet. Return to the planning conversation to
          describe your business problem in more detail.
        </GoACallout>
      )}

      {/* Inline-save / version-conflict errors */}
      {(errorKind === '409' || errorKind === '503' || errorKind === 'generic') &&
        errorMessage && (
          <GoACallout type="emergency" heading="Error saving change">
            {errorMessage}
          </GoACallout>
        )}

      {/* Key fields */}
      <GoAFormItem
        label="Business Problem Summary"
        helpText="Protected B per ATIA s.23 — deliberative government process content."
      >
        {/* ✓ ASVS:V-8.3.1 ✓ CAS:RULE-017 — businessModel.problemSummary Protected B ATIA s.23 */}
        {businessModel?.problemSummary ? (
          <MaskedField
            value={businessModel.problemSummary}
            fieldName="businessModel.problemSummary"
            canUnmask={true}
          />
        ) : (
          <span className="business-model-review__no-value">Not available</span>
        )}
      </GoAFormItem>

      <GoAFormItem label="Confidence Score">
        <span data-testid="confidence-score">{score}</span>
      </GoAFormItem>

      <GoAFormItem label="Extraction Date">
        <span>
          {businessModel?.updatedAt
            ? new Date(businessModel.updatedAt).toLocaleString()
            : '—'}
        </span>
      </GoAFormItem>

      <GoAFormItem label="Concept Count">
        <span data-testid="concept-count">{concepts.length}</span>
      </GoAFormItem>

      {/* Tab navigation — div[role=tablist]; GoATabs not used per design-system.json */}
      <div
        role="tablist"
        className="business-model-review__tablist"
        aria-label="Business model concept categories"
      >
        {TABS.map((tab) => (
          <div
            key={tab.id}
            role="tab"
            id={`tab-${tab.id}`}
            aria-selected={activeTab === tab.id}
            aria-controls={`tabpanel-${tab.id}`}
            tabIndex={activeTab === tab.id ? 0 : -1}
            onClick={() => setActiveTab(tab.id)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') setActiveTab(tab.id);
            }}
            className={`tab-item${activeTab === tab.id ? ' tab-item--active' : ''}`}
          >
            {tab.label}
          </div>
        ))}
      </div>

      <div
        role="tabpanel"
        id={`tabpanel-${activeTab}`}
        aria-labelledby={`tab-${activeTab}`}
        className="business-model-review__tabpanel"
      >
        {tabConcepts.length === 0 ? (
          <GoACallout type="information">{TAB_EMPTY_MESSAGES[activeTab]}</GoACallout>
        ) : (
          <GoATable>
            <thead>
              <tr>
                <th scope="col">Name</th>
                <th scope="col">Description</th>
                <th scope="col">Type</th>
              </tr>
            </thead>
            <tbody>
              {tabConcepts.map((concept) => {
                const isEditing = editingConceptId === concept.id;
                const isSaving = savingConceptId === concept.id;
                return (
                  <tr key={concept.id}>
                    <td>
                      {/* ✓ ASVS:V-8.3.1 ✓ CAS:RULE-017 — businessConcept.name Protected B ATIA s.23 */}
                      <MaskedField
                        value={concept.name}
                        fieldName="businessConcept.name"
                        canUnmask={true}
                      />
                    </td>
                    <td>
                      {concept.description ? (
                        /* ✓ ASVS:V-8.3.1 — businessConcept.description Protected B ATIA s.23 */
                        <MaskedField
                          value={concept.description}
                          fieldName="businessConcept.description"
                          canUnmask={true}
                        />
                      ) : (
                        <span aria-label="no description">—</span>
                      )}
                    </td>
                    <td>
                      {isEditing ? (
                        <GoADropdown
                          name="conceptType"
                          value={concept.conceptType}
                          onChange={handleConceptTypeChange}
                          disabled={isSaving}
                        >
                          {ALL_CONCEPT_TYPES.map((ct) => (
                            <GoADropdownItem
                              key={ct}
                              name={ct}
                              value={ct}
                              label={CONCEPT_TYPE_LABELS[ct] ?? ct}
                            />
                          ))}
                        </GoADropdown>
                      ) : (
                        <button
                          type="button"
                          className="concept-type-btn"
                          onClick={() => setEditingConceptId(concept.id)}
                          aria-label={`Edit concept type: ${concept.conceptType}`}
                          title="Click to change concept type"
                        >
                          {CONCEPT_TYPE_LABELS[concept.conceptType] ?? concept.conceptType}
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </GoATable>
        )}
      </div>

      {/* Policy notice — ATIA s.23 */}
      <GoACallout type="information" heading="Protected information">
        Business model content is government deliberative information protected under ATIA s.23. Do
        not export or share outside of the GoA planning process.
      </GoACallout>

      {/* Context actions — TC-006 */}
      <div className="business-model-review__actions">
        <GoAButton
          type="primary"
          onClick={handleConfirmBusinessModel}
          disabled={!canConfirm}
        >
          Confirm Business Model
        </GoAButton>
        <GoAButton type="secondary" onClick={handleReturnToPlanning}>
          Return to Planning Conversation
        </GoAButton>
        <GoAButton
          type="tertiary"
          onClick={handleDownloadBusinessModel}
          disabled={!businessModel}
        >
          Download Business Model
        </GoAButton>
      </div>
    </GoAContainer>
  );
};

export default BusinessModelReview;
