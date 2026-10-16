import React, { FunctionComponent } from 'react';
import { GoabBadge, GoabDetails } from '@abgov/react-components';
import { SolutionConfidence } from './model';

type Confidence = SolutionConfidence;

interface ConfidenceBarProps {
  confidence?: Confidence;
}

const SUCCESS_COLOR = '#006f4c';
const WARNING_COLOR = '#feba35';

const Bar: FunctionComponent<{
  score: number;
  threshold?: number;
  color: string;
  height: number;
  label: string;
  testId: string;
}> = ({ score, threshold, color, height, label, testId }) => (
  <div
    role="progressbar"
    aria-valuenow={score}
    aria-valuemin={0}
    aria-valuemax={100}
    aria-label={label}
    data-testid={testId}
    style={{
      background: '#dcdcdc',
      borderRadius: 4,
      height,
      flex: 1,
      minWidth: 140,
      maxWidth: 420,
      position: 'relative',
    }}
  >
    <div style={{ width: `${score}%`, background: color, height: '100%', borderRadius: 4 }} />
    {threshold !== undefined && (
      <div
        data-testid="confidence-threshold"
        title={`Threshold ${threshold}%`}
        style={{ position: 'absolute', left: `${threshold}%`, top: -2, bottom: -2, borderLeft: '2px solid #333' }}
      />
    )}
  </div>
);

export const ConfidenceBar: FunctionComponent<ConfidenceBarProps> = ({ confidence }) => {
  if (!confidence) {
    return (
      <p data-testid="confidence-empty" style={{ margin: 0 }}>
        Confidence: not assessed yet — analyze the problem to see how well it is understood.
      </p>
    );
  }

  const { score, threshold, factors } = confidence;
  const sufficient = score >= threshold;

  return (
    <div data-testid="confidence-bar">
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <strong>Confidence: {score}%</strong>
        <Bar
          score={score}
          threshold={threshold}
          color={sufficient ? SUCCESS_COLOR : WARNING_COLOR}
          height={14}
          label="Confidence"
          testId="confidence-progress"
        />
        <GoabBadge
          type={sufficient ? 'success' : 'important'}
          testId="confidence-badge"
          content={sufficient ? 'Sufficient to propose a solution' : `Below ${threshold}% — more detail needed`}
        />
      </div>
      <GoabDetails heading="Confidence breakdown" testId="confidence-breakdown" mt="m">
        <div
          role="list"
          style={{
            listStyle: 'none',
            padding: 0,
            margin: 0,
            display: 'grid',
            gridTemplateColumns: 'minmax(140px, 220px) minmax(120px, 1fr) 3rem minmax(0, 2fr)',
            gap: '8px 12px',
            alignItems: 'center',
          }}
        >
          {factors.map((factor) => (
            <div role="listitem" key={factor.id} style={{ display: 'contents' }}>
              <span data-testid={`confidence-factor-${factor.id}`}>{factor.label}</span>
              <Bar
                score={factor.score}
                color={factor.score >= threshold ? SUCCESS_COLOR : WARNING_COLOR}
                height={8}
                label={factor.label}
                testId={`confidence-factor-bar-${factor.id}`}
              />
              <span>{factor.score}%</span>
              <span>{factor.note || ''}</span>
            </div>
          ))}
        </div>
      </GoabDetails>
    </div>
  );
};

export default ConfidenceBar;
