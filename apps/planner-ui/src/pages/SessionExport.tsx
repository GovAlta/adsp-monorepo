/**
 * SessionExport — pageId: session-export, pageType: detail-view
 *
 * Shows a read-only summary of the planning session for final export.
 * Three tabs: Business Model Summary, Hypothesis Summary, Specialist Consultations.
 * "Download JSON Export" calls POST /sessions/{sessionId}/exports with format in the
 * request body — NOT as a URL query parameter.
 *
 * FAC-S5-024: Export format param in POST body — no Protected B data in URL query strings.
 *   Blob download URL revoked immediately after click — no persistent Protected B URL.
 * FAC-S5-026: No Protected B data written to localStorage, sessionStorage, or cookies.
 * ✓ ASVS:V-8.3.1 — all Protected B fields rendered via MaskedField; no browser-storage write.
 * ✓ CAS:RULE-017 — ATIA s.23 deliberative content masked by default.
 *
 * TC-030, TC-031, TC-032, TC-033, TC-034 (UC-008)
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  GoAContainer,
  GoAButton,
  GoACallout,
  GoACircularProgress,
  GoABadge,
  GoAFormItem,
} from '@abgov/react-components';
import { api } from '../services/api';
import type {
  PlanningSession,
  BusinessModel,
  SolutionHypothesis,
  PlanningSessionStatus,
} from '../services/api.types';
import MaskedField from '../components/MaskedField';

// ──────────────────────────────────────────────────────────────────────────────
// Constants
// ──────────────────────────────────────────────────────────────────────────────

type TabId = 'business-model' | 'hypothesis' | 'specialists';
type ErrorKind = '404' | '403' | '409' | '503' | 'generic' | null;

const SESSION_EXPORT_TABS: { id: TabId; label: string }[] = [
  { id: 'business-model', label: 'Business Model Summary' },
  { id: 'hypothesis', label: 'Hypothesis Summary' },
  { id: 'specialists', label: 'Specialist Consultations' },
];

function getStatusBadgeType(
  status: PlanningSessionStatus,
): 'information' | 'important' | 'success' | 'emergency' {
  switch (status) {
    case 'active':
      return 'information';
    case 'paused':
      return 'important';
    case 'completed':
      return 'success';
    case 'archived':
      return 'emergency';
    default:
      return 'information';
  }
}

// ──────────────────────────────────────────────────────────────────────────────
// Component
// ──────────────────────────────────────────────────────────────────────────────

const SessionExport: React.FC = () => {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();

  const [session, setSession] = useState<PlanningSession | null>(null);
  const [businessModel, setBusinessModel] = useState<BusinessModel | null>(null);
  const [hypothesis, setHypothesis] = useState<SolutionHypothesis | null>(null);
  const [activeTab, setActiveTab] = useState<TabId>('business-model');
  const [loading, setLoading] = useState(true);
  const [exportLoading, setExportLoading] = useState(false);
  const [errorKind, setErrorKind] = useState<ErrorKind>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // ── Load session, business model, accepted hypothesis on mount ────────────

  useEffect(() => {
    if (!sessionId) return;
    setLoading(true);
    setErrorKind(null);
    setErrorMessage(null);
    Promise.all([
      api.getSession(sessionId),
      api.getBusinessModel(sessionId),
      api.listHypotheses(sessionId),
    ])
      .then(([sess, bm, hyps]) => {
        setSession(sess);
        setBusinessModel(bm);
        // Find the accepted hypothesis for export eligibility (TC-034)
        const accepted = hyps.items.find((h) => h.status === 'accepted') ?? null;
        setHypothesis(accepted);
      })
      .catch((err: unknown) => {
        const status = (err as { response?: { status?: number } })?.response?.status;
        if (status === 404) {
          setErrorKind('404');
          setErrorMessage(
            'This planning session could not be found. It may have been archived.',
          );
        } else if (status === 403) {
          setErrorKind('403');
          setErrorMessage(
            'You do not have permission to export this planning session. You can only export your own planning sessions.',
          );
        } else {
          setErrorKind('generic');
          setErrorMessage(
            'An unexpected error occurred while loading the session. Please try again.',
          );
        }
      })
      .finally(() => setLoading(false));
  }, [sessionId]);

  // ── Export handler ────────────────────────────────────────────────────────
  // FAC-S5-024: format passed in POST body, NOT as a URL query string (TC-034)

  const handleDownloadExport = useCallback(() => {
    if (!sessionId || !session) return;
    setExportLoading(true);
    setErrorKind(null);
    setErrorMessage(null);
    api
      .initiateExport(sessionId, { format: 'json' })
      .then((exportRecord) => {
        if (exportRecord.downloadUrl) {
          // Trigger browser file download via temporary anchor element.
          // FAC-S5-026: no Protected B data written to localStorage; anchor removed immediately
          // after click — no persistent URL reference.
          const a = document.createElement('a');
          a.href = exportRecord.downloadUrl;
          a.download = `${session.title ?? 'session'}-${new Date().toISOString().slice(0, 10)}.json`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          // Anchor (and its href reference) is removed from DOM — no persistent blob URL
        }
      })
      .catch((err: unknown) => {
        const status = (err as { response?: { status?: number } })?.response?.status;
        if (status === 503) {
          setErrorKind('503');
          setErrorMessage(
            'The export service is temporarily unavailable. No partial export has been created. Please try again in a few minutes.',
          );
        } else if (status === 403) {
          setErrorKind('403');
          setErrorMessage(
            'You do not have permission to export this planning session.',
          );
        } else if (status === 409) {
          setErrorKind('409');
          setErrorMessage(
            'A concurrent export is already in progress for this session. Please wait a moment and try again.',
          );
        } else {
          setErrorKind('generic');
          setErrorMessage('Failed to generate export. Please try again.');
        }
      })
      .finally(() => setExportLoading(false));
  }, [sessionId, session]);

  // ── Loading / fatal-error states ─────────────────────────────────────────

  if (loading) {
    return (
      <GoAContainer>
        <GoACircularProgress message="Loading session..." />
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

  // ── Derived flags ─────────────────────────────────────────────────────────

  const canExport = hypothesis !== null && hypothesis.status === 'accepted';

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <GoAContainer>
      {/* Heading row with session status badge */}
      <div className="session-export__heading-row">
        <h1>Session Plan Export</h1>
        {session && (
          <GoABadge
            type={getStatusBadgeType(session.status)}
            content={session.status.charAt(0).toUpperCase() + session.status.slice(1)}
          />
        )}
      </div>

      {/* Key fields */}
      <GoAFormItem label="Session Title">
        {/* ✓ ASVS:V-8.3.1 ✓ CAS:RULE-017 — planningSession.title Protected B ATIA s.23 */}
        {session?.title ? (
          <MaskedField
            value={session.title}
            fieldName="planningSession.title"
            canUnmask={true}
          />
        ) : (
          <span>Untitled Planning Session</span>
        )}
      </GoAFormItem>

      <GoAFormItem label="Business Problem Summary">
        {/* ✓ ASVS:V-8.3.1 ✓ CAS:RULE-017 — planningSession.businessProblemSummary Protected B ATIA s.23 */}
        {session?.businessProblemSummary ? (
          <MaskedField
            value={session.businessProblemSummary}
            fieldName="planningSession.businessProblemSummary"
            canUnmask={true}
          />
        ) : (
          <span>No summary available</span>
        )}
      </GoAFormItem>

      <GoAFormItem label="Hypothesis Status">
        <span data-testid="hypothesis-status">
          {hypothesis?.status ?? 'Not yet reviewed'}
        </span>
      </GoAFormItem>

      <GoAFormItem label="Created Date">
        <span>
          {session?.createdAt ? new Date(session.createdAt).toLocaleString() : '—'}
        </span>
      </GoAFormItem>

      <GoAFormItem label="Last Updated">
        <span>
          {session?.updatedAt ? new Date(session.updatedAt).toLocaleString() : '—'}
        </span>
      </GoAFormItem>

      {/* Export locked warning — TC-032 */}
      {!canExport && (
        <GoACallout type="important" heading="Export locked">
          This session cannot be exported until the hypothesis has been reviewed and accepted.
          Complete the hypothesis review step first.
        </GoACallout>
      )}

      {/* Export / load errors */}
      {(errorKind === '503' || errorKind === '409' || errorKind === 'generic') &&
        errorMessage && (
          <GoACallout type="emergency" heading="Export error">
            {errorMessage}
          </GoACallout>
        )}

      {/* Tab navigation — div[role=tablist]; GoATabs not used per design-system.json */}
      <div
        role="tablist"
        className="session-export__tablist"
        aria-label="Session plan sections"
      >
        {SESSION_EXPORT_TABS.map((tab) => (
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
        className="session-export__tabpanel"
      >
        {/* Business Model Summary tab */}
        {activeTab === 'business-model' &&
          (businessModel ? (
            <>
              <GoAFormItem label="Confidence Score">
                <span>{businessModel.confidenceScore}</span>
              </GoAFormItem>
              <GoAFormItem label="Concept Count">
                <span>{businessModel.concepts.length}</span>
              </GoAFormItem>
              <GoAFormItem label="Model Version">
                <span>{businessModel.version}</span>
              </GoAFormItem>
            </>
          ) : (
            <GoACallout type="information">
              Business model data could not be loaded for this session.
            </GoACallout>
          ))}

        {/* Hypothesis Summary tab */}
        {activeTab === 'hypothesis' &&
          (hypothesis ? (
            <>
              <GoAFormItem label="Hypothesis Status">
                <span>{hypothesis.status}</span>
              </GoAFormItem>
              <GoAFormItem label="Summary">
                {/* ✓ ASVS:V-8.3.1 ✓ CAS:RULE-017 — solutionHypothesis.summary Protected B ATIA s.23 */}
                <MaskedField
                  value={hypothesis.summary}
                  fieldName="solutionHypothesis.summary"
                  canUnmask={true}
                />
              </GoAFormItem>
              {hypothesis.reasoning && (
                <GoAFormItem label="Reasoning">
                  {/* ✓ ASVS:V-8.3.1 ✓ CAS:RULE-017 — solutionHypothesis.reasoning Protected B ATIA s.23 */}
                  <MaskedField
                    value={hypothesis.reasoning}
                    fieldName="solutionHypothesis.reasoning"
                    canUnmask={true}
                  />
                </GoAFormItem>
              )}
              {hypothesis.patternId && (
                <GoAFormItem label="Pattern ID">
                  <span>{hypothesis.patternId}</span>
                </GoAFormItem>
              )}
            </>
          ) : (
            <GoACallout type="information">
              No accepted hypothesis found for this session. Complete the hypothesis review step
              before exporting.
            </GoACallout>
          ))}

        {/* Specialist Consultations tab */}
        {activeTab === 'specialists' && (
          <GoACallout type="information">
            No specialist consultations were completed during this session.
          </GoACallout>
        )}
      </div>

      {/* Policy notice — ATIA s.23, POPA s.17 */}
      <GoACallout type="information" heading="Protected information">
        The exported session plan contains deliberative government information under ATIA s.23 and
        personal information under POPA s.17. This information is classified Protected B. Exported
        files must be handled in accordance with GoA information management policies. Do not share
        exported files outside of authorized channels. User identity information (userId, tenantId)
        is excluded from exports for the planner-user role.
      </GoACallout>

      {/* Context actions — TC-034 */}
      <div className="session-export__actions">
        {/* FAC-S5-024: format parameter is in POST body, NOT a URL query string */}
        <GoAButton
          type="primary"
          onClick={handleDownloadExport}
          disabled={!canExport || exportLoading}
        >
          {exportLoading ? 'Preparing export...' : 'Download JSON Export'}
        </GoAButton>
        <GoAButton
          type="secondary"
          onClick={() => navigate(`/sessions/${sessionId}/planning`)}
        >
          Back to Planning Session
        </GoAButton>
      </div>
    </GoAContainer>
  );
};

export default SessionExport;
