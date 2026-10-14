import React, { FunctionComponent, useState } from 'react';
import {
  GoabBadge,
  GoabButton,
  GoabButtonGroup,
  GoabFormItem,
  GoabIconButton,
  GoabInput,
  GoabModal,
} from '@abgov/react-components';
import styled from 'styled-components';
import { PlannerApi } from './api';
import { Solution } from './model';
import { download, safeName, solutionToMarkdown } from './utils';

const Bar = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  margin-bottom: 1rem;
`;

const Row = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.5rem;
  min-width: 0;
`;

const RenameRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  gap: 0.5rem;
`;

interface SolutionHeaderProps {
  solution: Solution;
  api: PlannerApi;
  onSolutionChange: (solution: Solution) => void;
  onBack?: () => void;
}

export const SolutionHeader: FunctionComponent<SolutionHeaderProps> = ({ solution, api, onSolutionChange, onBack }) => {
  const [renaming, setRenaming] = useState(false);
  const [name, setName] = useState(solution.name);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [working, setWorking] = useState(false);

  const attempt = async (action: () => Promise<void>) => {
    setWorking(true);
    try {
      await action();
    } catch {
      // The api reports the error to the user.
    } finally {
      setWorking(false);
    }
  };

  const startRename = () => {
    setName(solution.name);
    setRenaming(true);
  };
  const saveName = () =>
    attempt(async () => {
      onSolutionChange(await api.updateSolution(solution.id, { name: name.trim() }));
      setRenaming(false);
    });
  const exportJson = () =>
    attempt(async () => {
      const data = await api.exportSolution(solution.id);
      download(`planner-${safeName(solution)}.json`, JSON.stringify(data, null, 2), 'application/json');
    });
  const exportReport = () =>
    download(`planner-${safeName(solution)}.md`, solutionToMarkdown(solution), 'text/markdown');
  const remove = () =>
    attempt(async () => {
      await api.deleteSolution(solution.id);
      setConfirmDelete(false);
      onBack?.();
    });

  return (
    <>
      {onBack && (
        <GoabButton size="compact" type="tertiary" leadingIcon="arrow-back" testId="back-to-solutions" onClick={onBack}>
          Back to solutions
        </GoabButton>
      )}
      <Bar>
        {renaming ? (
          <RenameRow>
            <GoabFormItem label="Solution name">
              <GoabInput
                name="solutionName"
                value={name}
                width="320px"
                testId="rename-input"
                onChange={(detail) => setName(detail.value)}
              />
            </GoabFormItem>
            <GoabButton size="compact" testId="rename-save" disabled={working || !name.trim()} onClick={saveName}>
              Save
            </GoabButton>
            <GoabButton size="compact" type="tertiary" testId="rename-cancel" onClick={() => setRenaming(false)}>
              Cancel
            </GoabButton>
          </RenameRow>
        ) : (
          <Row>
            <h1 style={{ margin: 0, overflowWrap: 'anywhere', minWidth: 0 }} data-testid="solution-title">
              {solution.name}
            </h1>
            <GoabIconButton
              icon="pencil"
              title="Edit solution name"
              ariaLabel="Edit solution name"
              testId="rename-solution"
              onClick={startRename}
            />
            <GoabBadge type="information" content={solution.status} icon={false} />
          </Row>
        )}
        <Row role="group" aria-label="Export and delete">
          <GoabButton
            size="compact"
            type="secondary"
            leadingIcon="download"
            testId="download-json"
            disabled={working}
            onClick={exportJson}
          >
            Download JSON
          </GoabButton>
          <GoabButton
            size="compact"
            type="secondary"
            leadingIcon="document-text"
            testId="download-report"
            onClick={exportReport}
          >
            Download report (.md)
          </GoabButton>
          <GoabButton
            size="compact"
            type="tertiary"
            variant="destructive"
            testId="delete-solution"
            onClick={() => setConfirmDelete(true)}
          >
            Delete solution
          </GoabButton>
        </Row>
      </Bar>
      <GoabModal
        testId="delete-solution-modal"
        open={confirmDelete}
        heading="Delete solution"
        onClose={() => setConfirmDelete(false)}
        actions={
          <GoabButtonGroup alignment="end" mt="m">
            <GoabButton size="compact" type="secondary" testId="delete-cancel" onClick={() => setConfirmDelete(false)}>
              Cancel
            </GoabButton>
            <GoabButton
              size="compact"
              variant="destructive"
              testId="delete-confirm"
              disabled={working}
              onClick={remove}
            >
              Delete
            </GoabButton>
          </GoabButtonGroup>
        }
      >
        Delete <strong>{solution.name}</strong>? This cannot be undone.
      </GoabModal>
    </>
  );
};

export default SolutionHeader;
