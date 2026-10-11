/**
 * PatternDetail.tsx — Read-only view of a business pattern.
 *
 * Route: /admin/patterns/:patternId/view
 * Access: planner-admin or tenant-admin required.
 */

import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  GoAButton,
  GoACallout,
  GoACircularProgress,
  GoAContainer,
  GoADetails,
  GoATable,
} from '@abgov/react-components';
import { api } from '../services/api';
import type { BusinessPattern } from '../services/api.types';

const PatternDetail: React.FC = () => {
  const { patternId } = useParams<{ patternId: string }>();
  const navigate = useNavigate();

  const [pattern, setPattern] = useState<BusinessPattern | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!patternId) return;
    api.getPattern(patternId)
      .then(setPattern)
      .catch(() => setError('Pattern could not be loaded. It may have been removed or you may not have access.'))
      .finally(() => setLoading(false));
  }, [patternId]);

  if (loading) {
    return (
      <GoAContainer>
        <GoACircularProgress variant="inline" message="Loading pattern..." />
      </GoAContainer>
    );
  }

  if (error || !pattern) {
    return (
      <GoAContainer>
        <GoACallout type="emergency" heading="Pattern not found">
          {error ?? 'The requested pattern could not be found.'}
        </GoACallout>
        <div style={{ marginTop: 'var(--goa-space-m)' }}>
          <GoAButton type="secondary" onClick={() => navigate('/admin/patterns')}>
            Back to Pattern Library
          </GoAButton>
        </div>
      </GoAContainer>
    );
  }

  return (
    <GoAContainer>
      {/* ── Header ────────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--goa-space-l)', flexWrap: 'wrap', gap: 'var(--goa-space-m)' }}>
        <div>
          <h1 style={{ margin: 0 }}>{pattern.name}</h1>
          {pattern.applicationType && (
            <p style={{ margin: 'var(--goa-space-xs) 0 0', color: 'var(--goa-color-text-secondary)', fontStyle: 'italic' }}>
              {pattern.applicationType}
            </p>
          )}
        </div>
        <div style={{ display: 'flex', gap: 'var(--goa-space-s)' }}>
          <GoAButton type="secondary" onClick={() => navigate('/admin/patterns')}>
            Back to Pattern Library
          </GoAButton>
          <GoAButton type="primary" onClick={() => navigate(`/admin/patterns/${pattern.id}`)}>
            Edit Pattern
          </GoAButton>
        </div>
      </div>

      {/* ── Purpose ───────────────────────────────────────────────────── */}
      {pattern.purpose && (
        <GoACallout type="information" heading="Purpose">
          {pattern.purpose}
        </GoACallout>
      )}

      {/* ── Domain Language ───────────────────────────────────────────── */}
      {pattern.commonDomainLanguage && pattern.commonDomainLanguage.length > 0 && (
        <div style={{ marginTop: 'var(--goa-space-l)' }}>
          <h2 style={{ marginBottom: 'var(--goa-space-s)' }}>Common Domain Language</h2>
          <p style={{ color: 'var(--goa-color-text-secondary)', fontSize: '0.875rem', marginBottom: 'var(--goa-space-s)' }}>
            Words and phrases commonly heard when this pattern applies.
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--goa-space-xs)' }}>
            {pattern.commonDomainLanguage.map((term) => (
              <span
                key={term}
                style={{
                  background: 'var(--goa-color-greyscale-100)',
                  border: '1px solid var(--goa-color-greyscale-200)',
                  borderRadius: '4px',
                  padding: '2px 10px',
                  fontSize: '0.875rem',
                  color: 'var(--goa-color-text-default)',
                }}
              >
                {term}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* ── Common Features ───────────────────────────────────────────── */}
      {pattern.commonFeatures && pattern.commonFeatures.length > 0 && (
        <div style={{ marginTop: 'var(--goa-space-l)' }}>
          <h2 style={{ marginBottom: 'var(--goa-space-s)' }}>Common Features</h2>
          <p style={{ color: 'var(--goa-color-text-secondary)', fontSize: '0.875rem', marginBottom: 'var(--goa-space-s)' }}>
            Capabilities typically present in applications matching this pattern.
          </p>
          <ul style={{ paddingLeft: 'var(--goa-space-l)', margin: 0 }}>
            {pattern.commonFeatures.map((f, i) => (
              <li key={i} style={{ marginBottom: 'var(--goa-space-xs)' }}>{f}</li>
            ))}
          </ul>
        </div>
      )}

      {/* ── Confidence Signals ────────────────────────────────────────── */}
      {((pattern.strongConfidenceSignals?.length ?? 0) > 0 || (pattern.weakSignals?.length ?? 0) > 0) && (
        <div style={{ marginTop: 'var(--goa-space-l)' }}>
          <h2 style={{ marginBottom: 'var(--goa-space-s)' }}>Confidence Signals</h2>

          {pattern.strongConfidenceSignals && pattern.strongConfidenceSignals.length > 0 && (
            <GoADetails heading="Strong Signals — high confidence this pattern applies">
              <ul style={{ paddingLeft: 'var(--goa-space-l)', margin: 0 }}>
                {pattern.strongConfidenceSignals.map((s, i) => (
                  <li key={i} style={{ marginBottom: 'var(--goa-space-xs)' }}>{s}</li>
                ))}
              </ul>
            </GoADetails>
          )}

          {pattern.weakSignals && pattern.weakSignals.length > 0 && (
            <GoADetails heading="Weak Signals — common but not specific to this pattern">
              <ul style={{ paddingLeft: 'var(--goa-space-l)', margin: 0 }}>
                {pattern.weakSignals.map((s, i) => (
                  <li key={i} style={{ marginBottom: 'var(--goa-space-xs)' }}>{s}</li>
                ))}
              </ul>
            </GoADetails>
          )}
        </div>
      )}

      {/* ── ADSP Service Recommendations ─────────────────────────────── */}
      {pattern.adspServiceMappings && pattern.adspServiceMappings.length > 0 && (
        <div style={{ marginTop: 'var(--goa-space-l)' }}>
          <h2 style={{ marginBottom: 'var(--goa-space-s)' }}>ADSP Service Recommendations</h2>
          <p style={{ color: 'var(--goa-color-text-secondary)', fontSize: '0.875rem', marginBottom: 'var(--goa-space-s)' }}>
            ADSP platform services commonly used to implement this pattern.
          </p>
          <GoATable width="100%">
            <thead>
              <tr>
                <th style={{ width: '35%' }}>Service</th>
                <th>Typical Use Case</th>
              </tr>
            </thead>
            <tbody>
              {pattern.adspServiceMappings.map((m, i) => (
                <tr key={i}>
                  <td style={{ fontWeight: 500 }}>{m.serviceName}</td>
                  <td>{m.useCase}</td>
                </tr>
              ))}
            </tbody>
          </GoATable>
        </div>
      )}

      {/* ── Clarifying Questions ──────────────────────────────────────── */}
      {pattern.clarifyingQuestions && pattern.clarifyingQuestions.length > 0 && (
        <div style={{ marginTop: 'var(--goa-space-l)' }}>
          <h2 style={{ marginBottom: 'var(--goa-space-s)' }}>Clarifying Questions</h2>
          <p style={{ color: 'var(--goa-color-text-secondary)', fontSize: '0.875rem', marginBottom: 'var(--goa-space-s)' }}>
            Ask these to confirm whether this pattern fits before recommending it.
          </p>
          <ol style={{ paddingLeft: 'var(--goa-space-l)', margin: 0 }}>
            {pattern.clarifyingQuestions.map((q, i) => (
              <li key={i} style={{ marginBottom: 'var(--goa-space-xs)' }}>{q}</li>
            ))}
          </ol>
        </div>
      )}

      {/* ── Assumptions & Unknowns ────────────────────────────────────── */}
      {((pattern.commonAssumptions?.length ?? 0) > 0 || (pattern.knownUnknowns?.length ?? 0) > 0) && (
        <div style={{ marginTop: 'var(--goa-space-l)' }}>
          <h2 style={{ marginBottom: 'var(--goa-space-s)' }}>Assumptions & Unknowns</h2>

          {pattern.commonAssumptions && pattern.commonAssumptions.length > 0 && (
            <GoADetails heading="Common Assumptions">
              <ul style={{ paddingLeft: 'var(--goa-space-l)', margin: 0 }}>
                {pattern.commonAssumptions.map((a, i) => (
                  <li key={i} style={{ marginBottom: 'var(--goa-space-xs)' }}>{a}</li>
                ))}
              </ul>
            </GoADetails>
          )}

          {pattern.knownUnknowns && pattern.knownUnknowns.length > 0 && (
            <GoADetails heading="Known Unknowns">
              <ul style={{ paddingLeft: 'var(--goa-space-l)', margin: 0 }}>
                {pattern.knownUnknowns.map((u, i) => (
                  <li key={i} style={{ marginBottom: 'var(--goa-space-xs)' }}>{u}</li>
                ))}
              </ul>
            </GoADetails>
          )}
        </div>
      )}

      {/* ── Footer Actions ────────────────────────────────────────────── */}
      <div style={{ marginTop: 'var(--goa-space-xl)', display: 'flex', gap: 'var(--goa-space-s)' }}>
        <GoAButton type="secondary" onClick={() => navigate('/admin/patterns')}>
          Back to Pattern Library
        </GoAButton>
        <GoAButton type="primary" onClick={() => navigate(`/admin/patterns/${pattern.id}`)}>
          Edit Pattern
        </GoAButton>
      </div>
    </GoAContainer>
  );
};

export default PatternDetail;
