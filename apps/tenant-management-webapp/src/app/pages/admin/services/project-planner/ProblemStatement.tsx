import React, { FunctionComponent, useEffect, useState } from 'react';
import { GoabButton, GoabCallout, GoabCircularProgress, GoabFormItem, GoabTextArea } from '@abgov/react-components';
import { AnalysisModeToggle } from './ModeLayoutToggle';
import { AnalysisMode } from './model';
import { fmtDate } from './utils';
import { PaneProps } from './workplaceTypes';

interface ProblemStatementProps extends PaneProps {
  title: string;
  analysisModes: AnalysisMode[];
  onAnalysisModeChange: (mode: AnalysisMode) => void;
}

export const ProblemStatement: FunctionComponent<ProblemStatementProps> = ({
  solution,
  api,
  mode,
  busy,
  run,
  onSolutionChange,
  title,
  analysisModes,
  onAnalysisModeChange,
}) => {
  const saved = solution.state.problemStatement || '';
  const [draft, setDraft] = useState(saved);
  const analysis = solution.state.analysis;

  useEffect(() => setDraft(saved), [saved]);

  const save = () => run(async () => onSolutionChange(await api.updateSolution(solution.id, { problemStatement: draft })));
  const analyze = () =>
    run(async () => {
      await api.updateSolution(solution.id, { problemStatement: draft });
      onSolutionChange(await api.analyze(solution.id, { mode }));
    });

  return (
    <div data-testid="problem-statement">
      <h2>{title}</h2>
      <GoabFormItem label="Problem statement" mb="m">
        <GoabTextArea
          name="problemStatement"
          value={draft}
          rows={5}
          width="100%"
          testId="problem-input"
          disabled={busy}
          onChange={(detail) => setDraft(detail.value)}
        />
      </GoabFormItem>
      <AnalysisModeToggle mode={mode} modes={analysisModes} onChange={onAnalysisModeChange} />
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', margin: '1rem 0' }}>
        <GoabButton type="secondary" testId="problem-save" disabled={busy || draft === saved} onClick={save}>
          Save
        </GoabButton>
        <GoabButton type="primary" testId="problem-analyze" disabled={busy || !draft.trim()} onClick={analyze}>
          {busy ? 'Working…' : 'Save & analyze'}
        </GoabButton>
      </div>
      {busy && <GoabCircularProgress visible size="small" message="Asking the model — this can take up to a minute" />}
      {analysis && (
        <GoabCallout
          type={analysis.warning ? 'important' : 'success'}
          heading={analysis.mode === 'ai' ? 'AI analysis' : 'Rule-based analysis'}
          testId="analysis-info"
        >
          {analysis.warning || `Completed ${fmtDate(analysis.analyzedOn)}`}
        </GoabCallout>
      )}
    </div>
  );
};

export default ProblemStatement;
