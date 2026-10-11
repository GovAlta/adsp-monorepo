/**
 * PatternEditor.tsx — Pattern Editor create/edit-form page
 *
 * Dual-mode form for creating (route: /admin/patterns/new) or editing
 * (route: /admin/patterns/:patternId) a business pattern.
 *
 * Create mode: no patternId param — blank form, POST /patterns on save.
 * Edit mode:   patternId param present — pre-populated from GET /patterns/:id, PUT on save,
 *              Deactivate button shown (PUT /patterns/:id/deactivate).
 *
 * Integration: INT-002 (ADSP Config Service) is STUB — createPattern, updatePattern,
 * deactivatePattern return 503 while stub is active (OPEN-004).
 *
 * Access: planner-admin or tenant-admin required (planner-user gets 403).
 * ✓ ASVS:V-9.1.1 — auth enforced at API layer; token from Keycloak context in api.ts
 *
 * Security:
 * - Pattern data (name, description, keywords) is tenant-scoped configuration, NOT Protected B.
 * - No MaskedField required (FAC-S5-025 PASS-N/A per security context).
 * - Form inputs rendered as controlled React text — no innerHTML usage (TC-052).
 * - No localStorage/sessionStorage writes (FAC-S5-026).
 * - Field values submitted in POST/PUT request body, not URL query strings (FAC-S5-024).
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  GoAButton,
  GoACallout,
  GoACheckbox,
  GoACircularProgress,
  GoAContainer,
  GoADropdown,
  GoADropdownItem,
  GoAFormItem,
  GoAInput,
  GoATextArea,
} from '@abgov/react-components';
import { api } from '../services/api';
import type { PatternStatus } from '../services/api.types';

// ─────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────

const ADSP_SERVICES: Array<{ value: string; label: string }> = [
  { value: 'form-service', label: 'Form Service' },
  { value: 'pdf-service', label: 'PDF Generation Service' },
  { value: 'comment-service', label: 'Comment Service' },
  { value: 'notification-service', label: 'Notification Service' },
  { value: 'file-service', label: 'File Service' },
  { value: 'directory-service', label: 'Directory Service' },
  { value: 'event-service', label: 'Event Service' },
  { value: 'task-service', label: 'Task Service' },
];

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

interface PatternForm {
  name: string;
  description: string;
  status: PatternStatus;
  keywords: string[];
  keywordInput: string;
  serviceAffinity: string[];
  matchThreshold: string;
}

interface PatternFormErrors {
  name?: string;
  description?: string;
  status?: string;
  matchThreshold?: string;
}

// ─────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────

const PatternEditor: React.FC = () => {
  const navigate = useNavigate();
  const { patternId } = useParams<{ patternId: string }>();
  const isEditMode = Boolean(patternId && patternId !== 'new');

  // ── Form state ─────────────────────────────────────────────────────────
  const [form, setForm] = useState<PatternForm>({
    name: '',
    description: '',
    status: 'active',
    keywords: [],
    keywordInput: '',
    serviceAffinity: [],
    matchThreshold: '70',
  });
  const [errors, setErrors] = useState<PatternFormErrors>({});
  const [generalError, setGeneralError] = useState<string | null>(null);

  // ── Operation state ────────────────────────────────────────────────────
  const [loadLoading, setLoadLoading] = useState<boolean>(isEditMode);
  const [submitLoading, setSubmitLoading] = useState<boolean>(false);
  const [deactivateLoading, setDeactivateLoading] = useState<boolean>(false);

  const mountedRef = useRef<boolean>(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // ── Load existing pattern (edit mode) ──────────────────────────────────
  const loadPattern = useCallback(async () => {
    if (!isEditMode || !patternId) return;
    setLoadLoading(true);
    setGeneralError(null);
    try {
      const pattern = await api.getPattern(patternId);
      if (!mountedRef.current) return;
      setForm({
        name: pattern.name,
        description: pattern.description ?? '',
        status: pattern.status,
        keywords: pattern.keywords ?? [],
        keywordInput: '',
        serviceAffinity: pattern.serviceAffinity ?? [],
        matchThreshold: String(pattern.matchThreshold),
      });
    } catch (err: unknown) {
      if (!mountedRef.current) return;
      const status = (err as { response?: { status?: number } })?.response?.status;
      if (status === 404) {
        setGeneralError(
          'The requested pattern could not be found. It may have been deactivated or deleted. Return to Pattern Library.'
        );
      } else {
        setGeneralError('Unable to load pattern data. Please try again.');
      }
    } finally {
      if (mountedRef.current) setLoadLoading(false);
    }
  }, [isEditMode, patternId]);

  useEffect(() => {
    loadPattern();
  }, [loadPattern]);

  // ── Field handlers ─────────────────────────────────────────────────────

  const handleFieldChange = (name: string, value: string) => {
    setForm((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: undefined }));
  };

  const handleStatusChange = (_name: string, values: string | string[]) => {
    const value = typeof values === 'string' ? values : values[0];
    setForm((prev) => ({ ...prev, status: value as PatternStatus }));
    setErrors((prev) => ({ ...prev, status: undefined }));
  };

  const handleKeywordInputChange = (_name: string, value: string) => {
    // Split on comma to support comma-separated entry; trimmed keywords added to list.
    if (value.includes(',')) {
      const parts = value.split(',').map((k) => k.trim()).filter(Boolean);
      const lastPart = parts.pop() ?? '';
      const newKeywords = parts.filter(
        (k) => k && !form.keywords.includes(k) && form.keywords.length + parts.length <= 20
      );
      if (newKeywords.length > 0) {
        setForm((prev) => ({
          ...prev,
          keywords: [...prev.keywords, ...newKeywords],
          keywordInput: lastPart,
        }));
      } else {
        setForm((prev) => ({ ...prev, keywordInput: lastPart }));
      }
    } else {
      setForm((prev) => ({ ...prev, keywordInput: value }));
    }
  };

  const addKeywordFromInput = () => {
    const keyword = form.keywordInput.trim();
    if (!keyword) return;
    if (form.keywords.length >= 20) return;
    if (form.keywords.includes(keyword)) {
      setForm((prev) => ({ ...prev, keywordInput: '' }));
      return;
    }
    setForm((prev) => ({
      ...prev,
      keywords: [...prev.keywords, keyword],
      keywordInput: '',
    }));
  };

  const removeKeyword = (keyword: string) => {
    setForm((prev) => ({
      ...prev,
      keywords: prev.keywords.filter((k) => k !== keyword),
    }));
  };

  const handleServiceAffinityChange = (service: string, checked: boolean) => {
    setForm((prev) => ({
      ...prev,
      serviceAffinity: checked
        ? [...prev.serviceAffinity, service]
        : prev.serviceAffinity.filter((s) => s !== service),
    }));
  };

  // ── Validation ─────────────────────────────────────────────────────────

  const validate = (): boolean => {
    const newErrors: PatternFormErrors = {};

    if (!form.name.trim()) {
      newErrors.name = 'Pattern name is required.';
    } else if (form.name.trim().length > 120) {
      newErrors.name = 'Pattern name must not exceed 120 characters.';
    }

    if (!form.description.trim()) {
      newErrors.description = 'Description is required.';
    } else if (form.description.trim().length > 2000) {
      newErrors.description = 'Description must not exceed 2000 characters.';
    }

    if (!form.status) {
      newErrors.status = 'Status is required.';
    }

    const threshold = Number(form.matchThreshold);
    if (form.matchThreshold === '' || isNaN(threshold)) {
      newErrors.matchThreshold = 'Match threshold is required.';
    } else if (!Number.isInteger(threshold)) {
      newErrors.matchThreshold = 'Match threshold must be a whole number.';
    } else if (threshold < 0 || threshold > 100) {
      newErrors.matchThreshold = 'Match threshold must be between 0 and 100.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // ── Submit handler (Save Pattern) ──────────────────────────────────────

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!validate()) return;

    setSubmitLoading(true);
    setGeneralError(null);

    const payload = {
      name: form.name.trim(),
      description: form.description.trim() || undefined,
      status: form.status,
      keywords: form.keywords.length > 0 ? form.keywords : undefined,
      serviceAffinity: form.serviceAffinity.length > 0 ? form.serviceAffinity : undefined,
      matchThreshold: Number(form.matchThreshold),
    };

    try {
      if (isEditMode && patternId) {
        // Edit mode — PUT /patterns/:id
        // Field values submitted in PUT request body, NOT URL query strings (FAC-S5-024)
        await api.updatePattern(patternId, payload);
      } else {
        // Create mode — POST /patterns
        // Field values submitted in POST request body, NOT URL query strings (FAC-S5-024)
        await api.createPattern(payload);
      }
      navigate('/admin/patterns');
    } catch (err: unknown) {
      if (!mountedRef.current) return;
      const status = (err as { response?: { status?: number } })?.response?.status;
      const responseData = (err as { response?: { data?: { message?: string } } })?.response?.data;

      if (status === 400) {
        // Duplicate pattern name within tenant (TC-029)
        setErrors((prev) => ({
          ...prev,
          name: responseData?.message ?? 'A pattern with this name already exists for this tenant. Choose a different name.',
        }));
      } else if (status === 413) {
        // Payload too large (TC-053)
        setGeneralError(
          'Your pattern content is too large to save. Shorten the description or reduce the number of keywords and try again.'
        );
      } else if (status === 422) {
        // Schema invalid (TC-054)
        setGeneralError(
          'The pattern data contains invalid values. Review all fields and correct any errors before saving.'
        );
      } else if (status === 403) {
        // Insufficient role (TC-036)
        setGeneralError('You do not have permission to save pattern changes.');
      } else if (status === 503) {
        // INT-002 stub unavailable (OPEN-004)
        setGeneralError(
          'Pattern management is temporarily unavailable. The pattern service is being provisioned. Your changes have not been saved.'
        );
      } else {
        setGeneralError('An unexpected error occurred. Please try again.');
      }
    } finally {
      if (mountedRef.current) setSubmitLoading(false);
    }
  };

  // ── Deactivate handler (edit mode only) ────────────────────────────────

  const handleDeactivate = async () => {
    if (!isEditMode || !patternId) return;
    setDeactivateLoading(true);
    setGeneralError(null);
    try {
      // Soft-deactivate — pattern set to status=inactive; retained for audit trail (BR-008, TC-082, TC-083)
      await api.deactivatePattern(patternId);
      navigate('/admin/patterns');
    } catch (err: unknown) {
      if (!mountedRef.current) return;
      const status = (err as { response?: { status?: number } })?.response?.status;
      if (status === 503) {
        setGeneralError(
          'Pattern management is temporarily unavailable. The pattern service is being provisioned. Your changes have not been saved.'
        );
      } else {
        setGeneralError('Unable to deactivate pattern. Please try again.');
      }
    } finally {
      if (mountedRef.current) setDeactivateLoading(false);
    }
  };

  // ─────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────

  if (loadLoading) {
    return (
      <GoAContainer>
        <GoACircularProgress variant="inline" message="Loading pattern..." />
      </GoAContainer>
    );
  }

  return (
    <GoAContainer>
      {/* ── Page heading — mode-dependent ──────────────────────────────── */}
      <h1>
        {isEditMode ? 'Edit Business Pattern' : 'Create Business Pattern'}
      </h1>
      <p>
        {isEditMode
          ? 'Update this pattern template. Changes take effect immediately for new planning sessions. Existing sessions are not retroactively affected.'
          : 'Define a new business pattern template. The AI Planning Agent will use this pattern when matching planning session content to recommend ADSP service compositions.'}
      </p>

      {/* ── General error / page-level callout ─────────────────────────── */}
      {generalError && (
        <GoACallout type="emergency" heading="Error">
          {generalError}
        </GoACallout>
      )}

      {/* ── Form ─────────────────────────────────────────────────────────── */}
      {/* Form inputs rendered as controlled React text — no innerHTML usage (TC-052) */}
      <form onSubmit={handleSubmit} noValidate>
        {/* Field 1: Pattern Name */}
        <GoAFormItem
          label="Pattern Name"
          requirement="required"
          helpText="Must be unique within your tenant. Used as the display label when the Planning Agent suggests this pattern."
          error={errors.name}
        >
          <GoAInput
            name="name"
            value={form.name}
            onChange={(_name, value) => handleFieldChange('name', value)}
            placeholder="e.g. Citizen Notification Workflow"
            maxLength={120}
            error={Boolean(errors.name)}
          />
        </GoAFormItem>

        {/* Field 2: Description */}
        <GoAFormItem
          label="Description"
          requirement="required"
          helpText="Describe the business pattern this template represents. This text helps the Planning Agent understand when to apply this pattern."
          error={errors.description}
        >
          <GoATextArea
            name="description"
            value={form.description}
            onChange={(_name, value) => handleFieldChange('description', value)}
            placeholder="Describe the business scenario or workflow this pattern represents..."
            maxCount={2000}
            error={Boolean(errors.description)}
          />
        </GoAFormItem>

        {/* Field 3: Status */}
        <GoAFormItem
          label="Status"
          requirement="required"
          helpText="Active patterns are used by the Planning Agent. Inactive patterns are retained for audit purposes but excluded from matching."
          error={errors.status}
        >
          <GoADropdown
            name="status"
            value={form.status}
            onChange={handleStatusChange}
            error={Boolean(errors.status)}
          >
            <GoADropdownItem value="active" label="Active" />
            <GoADropdownItem value="inactive" label="Inactive" />
          </GoADropdown>
        </GoAFormItem>

        {/* Field 4: Keywords — tag-input style built on GoAInput */}
        <GoAFormItem
          label="Keywords"
          helpText="Type a keyword and press Enter or add a comma to add it. Up to 20 keywords. Keywords are used by the Planning Agent for semantic matching."
        >
          <div style={{ display: 'flex', gap: 'var(--goa-space-s)', alignItems: 'flex-end' }}>
            <GoAInput
              name="keywordInput"
              value={form.keywordInput}
              onChange={handleKeywordInputChange}
              placeholder="Add a keyword and press Enter"
            />
            <GoAButton
              type="secondary"
              onClick={() => addKeywordFromInput()}
              disabled={!form.keywordInput.trim() || form.keywords.length >= 20}
            >
              Add
            </GoAButton>
          </div>
          {/* Keyword chips */}
          {form.keywords.length > 0 && (
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: 'var(--goa-space-xs)',
                marginTop: 'var(--goa-space-s)',
              }}
              role="list"
              aria-label="Added keywords"
            >
              {form.keywords.map((keyword) => (
                <span
                  key={keyword}
                  role="listitem"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 'var(--goa-space-xs)',
                    padding: '2px 8px',
                    background: 'var(--goa-color-status-information)',
                    borderRadius: '4px',
                    fontSize: 'var(--goa-font-size-sm)',
                  }}
                >
                  {keyword}
                  <button
                    type="button"
                    onClick={() => removeKeyword(keyword)}
                    aria-label={`Remove keyword: ${keyword}`}
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      padding: '0 2px',
                      lineHeight: 1,
                      fontFamily: 'inherit',
                    }}
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          )}
        </GoAFormItem>

        {/* Field 5: Service Affinity — checkbox group for ADSP services */}
        <GoAFormItem
          label="Service Affinity"
          helpText="Select ADSP services this pattern typically requires. Used to pre-populate specialist consultations when this pattern is matched."
        >
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: 'var(--goa-space-s)',
              paddingTop: 'var(--goa-space-xs)',
            }}
          >
            {ADSP_SERVICES.map((service) => (
              <GoACheckbox
                key={service.value}
                name={`serviceAffinity-${service.value}`}
                text={service.label}
                checked={form.serviceAffinity.includes(service.value)}
                onChange={(_name: string, checked: boolean) =>
                  handleServiceAffinityChange(service.value, checked)
                }
              />
            ))}
          </div>
        </GoAFormItem>

        {/* Field 6: Match Threshold */}
        <GoAFormItem
          label="Match Threshold"
          requirement="required"
          helpText="Minimum confidence score (0–100) required for the Planning Agent to suggest this pattern during a session. Lower values result in more frequent suggestions."
          error={errors.matchThreshold}
        >
          <GoAInput
            name="matchThreshold"
            value={form.matchThreshold}
            onChange={(_name, value) => handleFieldChange('matchThreshold', value)}
            placeholder="e.g. 70"
            type="number"
            min={0}
            max={100}
            error={Boolean(errors.matchThreshold)}
          />
        </GoAFormItem>

        {/* ── Form Actions ───────────────────────────────────────────────── */}
        <div
          style={{
            display: 'flex',
            gap: 'var(--goa-space-m)',
            flexWrap: 'wrap',
            alignItems: 'center',
            marginTop: 'var(--goa-space-xl)',
          }}
        >
          {/* Save Pattern — primary action */}
          <GoAButton
            type="submit"
            disabled={submitLoading || deactivateLoading}
            aria-label={isEditMode ? 'Save Pattern changes' : 'Save new Pattern'}
          >
            {submitLoading ? (
              <GoACircularProgress variant="inline" message="Saving..." />
            ) : (
              'Save Pattern'
            )}
          </GoAButton>

          {/* Cancel — navigates back to Pattern Library */}
          <GoAButton
            type="secondary"
            onClick={() => navigate('/admin/patterns')}
            disabled={submitLoading || deactivateLoading}
          >
            Cancel
          </GoAButton>

          {/* Deactivate Pattern — only in edit mode (content spec formActions.deleteAvailableInModes: ["edit"])
              Soft-deactivate: sets status=inactive, retained for audit trail (BR-008, TC-082, TC-083) */}
          {isEditMode && (
            <GoAButton
              type="primary"
              variant="destructive"
              onClick={handleDeactivate}
              disabled={submitLoading || deactivateLoading}
              aria-label="Deactivate this pattern — sets status to inactive and writes audit entry"
            >
              {deactivateLoading ? (
                <GoACircularProgress variant="inline" message="Deactivating..." />
              ) : (
                'Deactivate Pattern'
              )}
            </GoAButton>
          )}
        </div>
      </form>
    </GoAContainer>
  );
};

export default PatternEditor;
