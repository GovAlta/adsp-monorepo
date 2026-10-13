import React, { FunctionComponent } from 'react';
import { GoabButton } from '@abgov/react-components';
import styled from 'styled-components';
import { AnalysisMode } from './model';
import { Layout, LAYOUTS, SOLUTION_MODES, SolutionMode } from './workplaceLayout';

const Row = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.5rem;
`;

interface ToggleGroupProps<T extends string> {
  label: string;
  items: [T, string][];
  value: T;
  onChange: (value: T) => void;
  isDisabled?: (value: T) => boolean;
  testIdPrefix: string;
}

function ToggleGroup<T extends string>({ label, items, value, onChange, isDisabled, testIdPrefix }: ToggleGroupProps<T>) {
  return (
    <Row role="group" aria-label={label}>
      <strong>{label}:</strong>
      {items.map(([id, text]) => (
        <GoabButton
          key={id}
          size="compact"
          type={value === id ? 'primary' : 'secondary'}
          disabled={isDisabled?.(id)}
          testId={`${testIdPrefix}-${id}`}
          onClick={() => onChange(id)}
        >
          {text}
        </GoabButton>
      ))}
    </Row>
  );
}

interface ModeLayoutToggleProps {
  solutionMode: SolutionMode;
  onSolutionModeChange: (mode: SolutionMode) => void;
  layout: Layout;
  onLayoutChange: (layout: Layout) => void;
}

export const ModeLayoutToggle: FunctionComponent<ModeLayoutToggleProps> = ({
  solutionMode,
  onSolutionModeChange,
  layout,
  onLayoutChange,
}) => (
  <Row style={{ gap: '2rem' }}>
    <ToggleGroup label="Mode" items={SOLUTION_MODES} value={solutionMode} onChange={onSolutionModeChange} testIdPrefix="solution-mode" />
    <ToggleGroup label="Layout" items={LAYOUTS} value={layout} onChange={onLayoutChange} testIdPrefix="layout" />
  </Row>
);

interface AnalysisModeToggleProps {
  mode: AnalysisMode;
  modes: AnalysisMode[];
  onChange: (mode: AnalysisMode) => void;
}

export const AnalysisModeToggle: FunctionComponent<AnalysisModeToggleProps> = ({ mode, modes, onChange }) => (
  <ToggleGroup
    label="Analysis mode"
    items={[
      ['ai', 'AI analysis'],
      ['rules', 'Rule-based'],
    ]}
    value={mode}
    onChange={onChange}
    isDisabled={(id) => !modes.includes(id)}
    testIdPrefix="analysis-mode"
  />
);
