/**
 * NewSessionStart — pageId: new-session-start, pageType: start-page
 *
 * Collects a session title and creates a new planning session via POST /api/v1/sessions.
 * On success, navigates to the planning session page.
 *
 * FAC-S5-024: No Protected B data in URL query strings.
 * FAC-S5-026: No Protected B data written to localStorage/sessionStorage.
 * ✓ ASVS:V-9.1.1 — JWT sourced from Keycloak context, not localStorage.
 *
 * Security note (TC-051): session title input is rendered as text, never via innerHTML.
 * XSS sanitization occurs server-side via Zod schema validation.
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  GoAContainer,
  GoAButton,
  GoAFormItem,
  GoAInput,
  GoACallout,
  GoACircularProgress,
} from '@abgov/react-components';
import { api } from '../services/api';

const MAX_TITLE_LENGTH = 200;

const NewSessionStart: React.FC = () => {
  const navigate = useNavigate();

  const [title, setTitle] = useState('');
  const [titleError, setTitleError] = useState('');
  const [loading, setLoading] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const validateTitle = (value: string): string => {
    if (!value.trim()) return 'Enter a session title between 1 and 200 characters.';
    if (value.length > MAX_TITLE_LENGTH) return `Session title must not exceed ${MAX_TITLE_LENGTH} characters.`;
    return '';
  };

  const handleStart = async () => {
    const validationMsg = validateTitle(title);
    if (validationMsg) {
      setTitleError(validationMsg);
      return;
    }
    setTitleError('');
    setCreateError(null);
    setLoading(true);
    try {
      // ✓ ASVS:V-9.1.1 — auth header injected by api service layer
      // FAC-S5-024 — title submitted in POST request body, not URL query string
      const session = await api.createSession({ title: title.trim() });
      // Navigate to planning session — sessionId is a route param, not a query string
      navigate(`/sessions/${session.id}/planning`);
    } catch (err: unknown) {
      const status = (err as { status?: number }).status;
      if (status === 503) {
        setCreateError(
          'The planning session could not be created due to a system error. Please try again in a moment. ' +
            'If this problem persists, contact ADSP Support.'
        );
      } else if (status === 400) {
        setCreateError('The session title is invalid. Please check your input and try again.');
      } else if (status === 401) {
        setCreateError('Your session has expired. Please sign in again.');
      } else {
        setCreateError('An unexpected error occurred. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <GoAContainer>
      <h1>Start a New Planning Session</h1>

      {/* INT-001 Stub notice — removed: MaaS integration is active */}

      {/* Service description */}
      <GoAContainer>
        <p>
          The ADSP Project Planner guides you through a structured conversation to identify which ADSP
          platform services best support your business problem. You will describe your business situation,
          and the AI Planning Agent will ask clarifying questions, extract business concepts, and generate
          a solution hypothesis recommending the right ADSP services for your context. Your progress is
          automatically saved so you can pause and resume across work days.
        </p>
      </GoAContainer>

      {/* Service info */}
      <GoAContainer>
        <dl>
          <dt><strong>Estimated time</strong></dt>
          <dd>Approximately 30 minutes for an initial business problem description. You can pause and resume at any time.</dd>
          <dt><strong>Auto-save</strong></dt>
          <dd>Your progress is saved automatically after each Planning Agent response. You will not lose work if you close the browser.</dd>
          <dt><strong>Output format</strong></dt>
          <dd>At the end of your session you can export a structured JSON document containing your business model, accepted solution hypothesis, and implementation recommendations.</dd>
        </dl>
      </GoAContainer>

      {/* Preparation checklist */}
      <GoAContainer>
        <h2>Before you begin</h2>
        <p>To get the most value from your planning session, have the following ready before you start:</p>
        <ul>
          <li>
            <strong>Business problem statement</strong> — A plain-language description of the problem your
            program or service is trying to solve. It does not need to be technical — describe it from the
            perspective of the affected users or program staff.
          </li>
          <li>
            <strong>Stakeholder context</strong> — Who are the main actors involved? Include both internal
            GoA staff and external clients or partners who interact with the business process.
          </li>
          <li>
            <strong>Known constraints</strong> — Any policy, regulatory, budget, or timeline constraints
            that the solution must respect.
          </li>
          <li>
            <strong>Estimated scope</strong> — A rough sense of the scale — is this a single form and
            approval workflow, a multi-step service delivery process, or something larger?
          </li>
        </ul>
      </GoAContainer>

      {/* Session title form */}
      <GoAContainer>
        <h2>Name your session</h2>
        <p>Give this planning session a title that will help you identify it in your session list.</p>

        <GoAFormItem label="Session title" requirement="required" error={titleError}>
          <GoAInput
            name="title"
            value={title}
            placeholder="e.g. Grants Online Application Modernization"
            maxLength={MAX_TITLE_LENGTH}
            onChange={(_name: string, value: string) => {
              setTitle(value);
              if (titleError) setTitleError(validateTitle(value));
            }}
          />
        </GoAFormItem>
      </GoAContainer>

      {/* Error state (MongoDB 503) */}
      {createError && (
        <GoACallout type="emergency" heading="Unable to create session">
          {createError}
        </GoACallout>
      )}

      {/* Loading indicator */}
      {loading && <GoACircularProgress variant="inline" message="Creating session..." />}

      {/* Actions */}
      <div style={{ display: 'flex', gap: 'var(--goa-space-m)', marginTop: 'var(--goa-space-l)' }}>
        <GoAButton
          type="primary"
          disabled={loading}
          onClick={handleStart}
        >
          Start Planning Session
        </GoAButton>
        <GoAButton
          type="secondary"
          onClick={() => navigate('/sessions')}
        >
          Cancel
        </GoAButton>
      </div>
    </GoAContainer>
  );
};

export default NewSessionStart;
