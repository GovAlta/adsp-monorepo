// ConfidenceBadge — displays a confidence score with a Red → Purple → Green color ramp.
// Color anchors: 0% = #c8102e (GoA red), 50% = #6d2077 (GoA purple), 100% = #007a4e (GoA green).

import React from 'react';

export interface ConfidenceBadgeProps {
  score: number;
  showLabel?: boolean;
}

function getConfidenceColor(score: number): string {
  const red    = [200, 16,  46];   // #c8102e
  const purple = [109, 32, 119];   // #6d2077
  const green  = [  0, 122,  78];  // #007a4e
  let r: number, g: number, b: number;
  if (score <= 50) {
    const t = score / 50;
    r = Math.round(red[0] + (purple[0] - red[0]) * t);
    g = Math.round(red[1] + (purple[1] - red[1]) * t);
    b = Math.round(red[2] + (purple[2] - red[2]) * t);
  } else {
    const t = (score - 50) / 50;
    r = Math.round(purple[0] + (green[0] - purple[0]) * t);
    g = Math.round(purple[1] + (green[1] - purple[1]) * t);
    b = Math.round(purple[2] + (green[2] - purple[2]) * t);
  }
  return `rgb(${r}, ${g}, ${b})`;
}

function getStatusLabel(score: number): string {
  if (score >= 70) return 'Ready';
  if (score >= 50) return 'Building';
  return 'Low';
}

const ConfidenceBadge: React.FC<ConfidenceBadgeProps> = ({ score, showLabel = false }) => {
  const color = getConfidenceColor(score);
  return (
    <span
      style={{ color, fontWeight: 700, fontSize: '1rem' }}
      aria-label={`Confidence score: ${score}%`}
      data-testid="confidence-badge"
    >
      {showLabel ? `${score}% — ${getStatusLabel(score)}` : `${score}%`}
    </span>
  );
};

export default ConfidenceBadge;
