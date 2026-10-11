// ✓ ASVS:V-8.3.1 — Protected B / Protected A field rendering
// ✓ CAS:RULE-017 — Deliberative content masking for ATIA s.23 fields
// This component MUST NOT persist the raw value to any browser storage.
// Masking logic: first character + asterisks for strings; ***@domain.ca for email fields.

import React from 'react';
import { GoABadge } from '@abgov/react-components';

export interface MaskedFieldProps {
  /** The raw field value — displayed masked unless canUnmask is true. */
  value: string;
  /** Identifier for the field (used in aria-label). */
  fieldName: string;
  /** When true, renders the full unmasked value. Only set for tenant-admin role. */
  canUnmask?: boolean;
  /** When true, treats value as an email address and applies ***@domain.ca masking. */
  isEmail?: boolean;
}

/** Masks a plain string to: first character + asterisks. E.g. "Hello World" → "H**********" */
function maskString(value: string): string {
  if (!value) return '';
  if (value.length === 1) return value;
  return value.charAt(0) + '*'.repeat(value.length - 1);
}

/** Masks an email address to: ***@domain.ca pattern. */
function maskEmail(value: string): string {
  if (!value) return '';
  const atIndex = value.indexOf('@');
  if (atIndex === -1) return maskString(value);
  const domain = value.slice(atIndex); // includes the @
  return '***' + domain;
}

/**
 * MaskedField — renders a Protected B / Protected A field value with masking.
 *
 * Use this component wherever a protected field is displayed in the UI.
 * NEVER pass the raw value to localStorage, sessionStorage, or cookies from here.
 *
 * @example
 *   <MaskedField value={session.userId} fieldName="planningSession.userId" />
 *   <MaskedField value={user.email} fieldName="user.email" isEmail canUnmask={isTenantAdmin} />
 */
const MaskedField: React.FC<MaskedFieldProps> = ({
  value,
  fieldName,
  canUnmask = false,
  isEmail = false,
}) => {
  // ✓ ASVS:V-8.3.1 — no localStorage/sessionStorage/cookie write occurs in this component
  const displayValue: string = canUnmask
    ? value
    : isEmail
    ? maskEmail(value)
    : maskString(value);

  if (canUnmask) {
    return (
      <span
        aria-label={`${fieldName} (unmasked)`}
        data-testid={`masked-field-${fieldName}`}
      >
        {displayValue}
      </span>
    );
  }

  return (
    <GoABadge
      type="information"
      content={displayValue}
      aria-label={`${fieldName} (masked)`}
      data-testid={`masked-field-${fieldName}`}
    />
  );
};

export default MaskedField;
