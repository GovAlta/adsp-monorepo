/**
 * HypothesisReview — pageId: hypothesis-review, pageType: wizard-step-review
 *
 * Displays the Planning Agent's generated solution hypothesis for review.
 * Locked state shown when no hypothesis exists (business model confidence < 70).
 * "Accept Hypothesis" transitions status to 'accepted' and navigates to session-export.
 * "Request Revision" is disabled — INT-001 STUB pending OPEN-001/002/006.
 *
 * FAC-S5-024: Accept/revision requests use PATCH/POST body — no Protected B data in URL.
 * FAC-S5-026: No Protected B data written to localStorage, sessionStorage, or cookies.
 * ✓ ASVS:V-8.3.1 — hypothesis.summary and hypothesis.reasoning via MaskedField.
 * ✓ CAS:RULE-017 — ATIA s.23 deliberative planning content masked by default.
 *
 * TC-021, TC-022, TC-023, TC-088 (UC-004)
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  GoAContainer,
  GoAButton,
  GoACallout,
  GoACircularProgress,
  GoADetails,
  GoAFormItem,
  GoATextArea,
} from '@abgov/react-components';
import { api } from '../services/api';
import type { SolutionHypothesis, BusinessModel } from '../services/api.types';
import MaskedField from '../components/MaskedField';

// ──────────────────────────────────────────────────────────────────────────────
// Constants
// ──────────────────────────────────────────────────────────────────────────────

type ErrorKind = '404' | '403' | '422' | '503' | 'generic' | null;

// ──────────────────────────────────────────────────────────────────────────────
// Component
// ──────────────────────────────────────────────────────────────────────────────

const HypothesisReview: React.FC = () => {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();

  const [hypothesis, setHypothesis] = useState<SolutionHypothesis | null>(null);
  const [businessModel, setBusinessModel] = useState<BusinessModel | null>(null);
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(false);
  const [errorKind, setErrorKind] = useState<ErrorKind>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  // FAC-S5-026: revisionNote held in React state only — not written to localStorage
  const [revisionNote, setRevisionNote] = useState('');
  const [revisionSubmitted, setRevisionSubmitted] = useState(false);
  const [submittingRevision, setSubmittingRevision] = useState(false);
  const [generating, setGenerating] = useState(false);
  const pollTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Load hypothesis and business model on mount ───────────────────────────

  useEffect(() => {
    if (!sessionId) return;
    setLoading(true);
    setErrorKind(null);
    setErrorMessage(null);
    Promise.all([
      api.listHypotheses(sessionId),
      api.getBusinessModel(sessionId),
    ])
      .then(([result, bm]) => {
        const active =
          result.items.find((h) => h.status !== 'rejected' && h.status !== 'superseded') ??
          null;
        setHypothesis(active);
        setBusinessModel(bm);
      })
      .catch((err: unknown) => {
        const status = (err as { response?: { status?: number } })?.response?.status;
        if (status === 404) {
          setErrorKind('404');
          setErrorMessage(
            'The solution hypothesis could not be found. It may have been superseded. Reload the page to see the latest.',
          );
        } else if (status === 403) {
          setErrorKind('403');
          setErrorMessage('You do not have permission to access this planning session.');
        } else {
          setErrorKind('generic');
          setErrorMessage(
            'An unexpected error occurred while loading the hypothesis. Please try again.',
          );
        }
      })
      .finally(() => setLoading(false));
  }, [sessionId]);

  // ── Cleanup poll timer on unmount ─────────────────────────────────────────
  useEffect(() => {
    return () => {
      if (pollTimerRef.current) clearTimeout(pollTimerRef.current);
    };
  }, []);

  // ── Generate hypothesis ───────────────────────────────────────────────────
  const handleGenerateHypothesis = useCallback(() => {
    if (!sessionId) return;
    setGenerating(true);
    setErrorKind(null);
    setErrorMessage(null);
    api
      .generateHypothesis(sessionId)
      .then(() => {
        let attempts = 0;
        const poll = () => {
          attempts++;
          api.listHypotheses(sessionId).then((result) => {
            const active = result.items.find(
              (h) => h.status !== 'rejected' && h.status !== 'superseded',
            );
            if (active && active.status === 'proposed') {
              setHypothesis(active);
              setGenerating(false);
            } else if (attempts < 30) {
              pollTimerRef.current = setTimeout(poll, 3000);
            } else {
              setGenerating(false);
              setErrorKind('generic');
              setErrorMessage('Hypothesis generation timed out. Please try again.');
            }
          }).catch(() => {
            if (attempts < 30) {
              pollTimerRef.current = setTimeout(poll, 3000);
            } else {
              setGenerating(false);
            }
          });
        };
        pollTimerRef.current = setTimeout(poll, 3000);
      })
      .catch(() => {
        setGenerating(false);
        setErrorKind('generic');
        setErrorMessage('Failed to start hypothesis generation. Please try again.');
      });
  }, [sessionId]);

  // ── Accept hypothesis ─────────────────────────────────────────────────────
  // FAC-S5-024: status update in PATCH body — sessionId and hypothesisId in path only

  const handleAcceptHypothesis = useCallback(() => {
    if (!sessionId || !hypothesis) return;
    setAccepting(true);
    setErrorKind(null);
    setErrorMessage(null);
    api
      .updateHypothesisStatus(sessionId, hypothesis.id, { status: 'accepted' })
      .then(() => {
        navigate(`/sessions/${sessionId}/export`);
      })
      .catch((err: unknown) => {
        const status = (err as { response?: { status?: number } })?.response?.status;
        if (status === 422) {
          setErrorKind('422');
          setErrorMessage(
            'This hypothesis cannot be accepted in its current state. It may have already been accepted or superseded. Reload the page to see the current hypothesis status.',
          );
        } else if (status === 404) {
          setErrorKind('404');
          setErrorMessage(
            'The hypothesis was not found. It may have been superseded. Reload the page to see the latest hypothesis.',
          );
        } else {
          setErrorKind('generic');
          setErrorMessage('Failed to accept hypothesis. Please try again.');
        }
      })
      .finally(() => setAccepting(false));
  }, [sessionId, hypothesis, navigate]);

  // ── Request revision ─────────────────────────────────────────────────────

  const handleRequestRevision = useCallback(() => {
    if (!sessionId || !hypothesis || !revisionNote.trim()) return;
    setSubmittingRevision(true);
    setErrorKind(null);
    setErrorMessage(null);
    api
      .updateHypothesisStatus(sessionId, hypothesis.id, { status: 'rejected' })
      .then(() => {
        setRevisionSubmitted(true);
        setRevisionNote('');
        // Send revision note as a message so the Planning Agent can act on it
        return api.sendMessage(sessionId, {
          content: `**Revision request for the hypothesis:**\n\n${revisionNote.trim()}\n\nPlease refine the solution hypothesis based on this feedback.`,
        });
      })
      .then(() => {
        navigate(`/sessions/${sessionId}/planning`);
      })
      .catch(() => {
        setErrorKind('generic');
        setErrorMessage('Failed to submit revision request. Please try again.');
      })
      .finally(() => setSubmittingRevision(false));
  }, [sessionId, hypothesis, revisionNote, navigate]);

  // ── Loading / fatal-error states ─────────────────────────────────────────

  if (loading) {
    return (
      <GoAContainer>
        <GoACircularProgress message="Loading hypothesis..." />
      </GoAContainer>
    );
  }

  if (errorKind === '403') {
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

  const isLocked = hypothesis === null;
  const isAlreadyAccepted = hypothesis?.status === 'accepted';
  const isSuperseded = hypothesis?.status === 'superseded';

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <GoAContainer>
      <h1>Solution Hypothesis</h1>

      {/* Locked state — no hypothesis available (TC-021) */}
      {isLocked && !generating && (
        <>
          {(businessModel?.confidenceScore ?? 0) >= 70 ? (
            <GoACallout type="information" heading="Ready to generate hypothesis">
              Your business model has sufficient confidence ({businessModel?.confidenceScore}%). Click
              below to generate a solution hypothesis.
            </GoACallout>
          ) : (
            <GoACallout type="information" heading="Hypothesis not yet available">
              Your business model requires a confidence score of 70 or above before a hypothesis can
              be generated. Continue refining your business problem description in the planning
              conversation to reach the required score.{' '}
              {businessModel ? `Current score: ${businessModel.confidenceScore}%.` : ''}
            </GoACallout>
          )}
          {(businessModel?.confidenceScore ?? 0) >= 70 && (
            <GoAButton type="primary" onClick={handleGenerateHypothesis}>
              Generate Hypothesis
            </GoAButton>
          )}
          {(businessModel?.confidenceScore ?? 0) < 70 && (
            <GoAButton type="secondary" onClick={() => navigate(`/sessions/${sessionId}/planning`)}>
              Return to Planning
            </GoAButton>
          )}
        </>
      )}

      {/* Generating spinner */}
      {generating && (
        <GoACallout type="information" heading="Generating hypothesis...">
          The Planning Agent is generating a solution hypothesis based on your business model. This
          may take up to 30 seconds.
        </GoACallout>
      )}

      {/* Revision submitted confirmation */}
      {revisionSubmitted && (
        <GoACallout type="information" heading="Revision request received">
          Your revision request has been submitted. Returning to the planning conversation.
        </GoACallout>
      )}

      {/* Superseded hypothesis notice (TC-088) */}
      {isSuperseded && (
        <GoACallout type="information" heading="Hypothesis superseded">
          This hypothesis has been superseded by a revised version. The latest proposed hypothesis
          is shown above.
        </GoACallout>
      )}

      {/* Action errors */}
      {(errorKind === '422' || errorKind === '404' || errorKind === 'generic') &&
        errorMessage && (
          <GoACallout type="emergency" heading="Error">
            {errorMessage}
          </GoACallout>
        )}

      {/* Unlocked content — hypothesis exists */}
      {!isLocked && hypothesis && (
        <>
          {/* Proposed Solution Hypothesis section */}
          <section aria-labelledby="hypothesis-section-heading">
            <h2 id="hypothesis-section-heading">Proposed Solution Hypothesis</h2>
            <p>
              The Planning Agent has generated a solution hypothesis based on your confirmed business
              model. Review the proposed ADSP service composition and the reasoning behind each
              recommendation before accepting or requesting revisions.
            </p>

            <GoAFormItem label="Hypothesis Summary">
              {/* ✓ ASVS:V-8.3.1 ✓ CAS:RULE-017 — solutionHypothesis.summary Protected B ATIA s.23 */}
              <MaskedField
                value={hypothesis.summary}
                fieldName="solutionHypothesis.summary"
                canUnmask={true}
              />
            </GoAFormItem>

            <GoAFormItem label="Status">
              <span data-testid="hypothesis-status">{hypothesis.status}</span>
            </GoAFormItem>

            <GoAFormItem label="Hypothesis Version">
              <span>{hypothesis.version}</span>
            </GoAFormItem>

            {hypothesis.patternId && (
              <GoAFormItem label="Matched Business Pattern">
                <span>{hypothesis.patternId}</span>
              </GoAFormItem>
            )}
          </section>

          {/* Planning Agent Reasoning — collapsible GoADetails */}
          <GoADetails heading="Planning Agent Reasoning">
            <p>
              Expand this section to understand why each ADSP service was recommended for your
              business problem.
            </p>
            {hypothesis.reasoning ? (
              /* ✓ ASVS:V-8.3.1 ✓ CAS:RULE-017 — solutionHypothesis.reasoning Protected B ATIA s.23 */
              <MaskedField
                value={hypothesis.reasoning}
                fieldName="solutionHypothesis.reasoning"
                canUnmask={true}
              />
            ) : (
              <span>No reasoning provided.</span>
            )}
          </GoADetails>

          {/* Revision request */}
          <GoAFormItem
            label="Request a revision (optional)"
            helpText="Describe what should change. Submitting a revision rejects the current hypothesis and returns you to the planning conversation."
          >
            <GoATextArea
              name="revisionNote"
              value={revisionNote}
              placeholder="e.g. The form-service recommendation should also include comment-service for stakeholder engagement."
              onChange={(_name: string, value: string) => {
                setRevisionNote(value);
              }}
              rows={4}
            />
          </GoAFormItem>
        </>
      )}

      {/* Policy notice — ATIA s.23 */}
      <GoACallout type="information" heading="Protected information">
        The solution hypothesis and reasoning displayed on this page constitute deliberative
        government information under ATIA s.23. This information is classified Protected B. Access
        is restricted to authenticated Government of Alberta employees with the planner-user role or
        above. Do not share hypothesis content outside of authorized GoA channels or systems.
      </GoACallout>

      {/* Already accepted — show navigation instead of re-accepting */}
      {isAlreadyAccepted && (
        <GoACallout type="success" heading="Hypothesis accepted">
          This hypothesis has already been accepted. Proceed to the export step to download your session plan.
        </GoACallout>
      )}

      {/* Context actions — TC-022 */}
      {!isLocked && (
        <div className="hypothesis-review__actions">
          {isAlreadyAccepted ? (
            <GoAButton type="primary" onClick={() => navigate(`/sessions/${sessionId}/export`)}>
              Go to Export
            </GoAButton>
          ) : (
            <GoAButton
              type="primary"
              onClick={handleAcceptHypothesis}
              disabled={accepting}
            >
              {accepting ? 'Accepting...' : 'Accept Hypothesis'}
            </GoAButton>
          )}
          <GoAButton
            type="secondary"
            onClick={handleRequestRevision}
            disabled={submittingRevision || isAlreadyAccepted || !revisionNote.trim()}
          >
            {submittingRevision ? 'Submitting...' : 'Submit Revision'}
          </GoAButton>
        </div>
      )}
    </GoAContainer>
  );
};

export default HypothesisReview;
