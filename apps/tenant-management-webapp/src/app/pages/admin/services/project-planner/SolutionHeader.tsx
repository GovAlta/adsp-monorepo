import React, { FunctionComponent, useState } from 'react';
import { GoabBadge, GoabButton, GoabButtonGroup, GoabIconButton, GoabInput, GoabModal } from '@abgov/react-components';
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
  align-items: center;
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
        <GoabButton
          size="compact"
          type="tertiary"
          leadingIcon="arrow-back"
          testId="back-to-solutions"
          mb="m"
          onClick={onBack}
        >
          Back to solutions
        </GoabButton>
      )}
      <Bar>
        {renaming ? (
          <RenameRow>
            <GoabInput
              name="solutionName"
              value={name}
              width="320px"
              testId="rename-input"
              aria-label="Solution name"
              onChange={(detail) => setName(detail.value)}
            />
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
          <GoabIconButton
            icon="download"
            title="Download JSON"
            ariaLabel="Download JSON"
            testId="download-json"
            disabled={working}
            onClick={exportJson}
          />
          <GoabIconButton
            icon="document-text"
            title="Download report (.md)"
            ariaLabel="Download report (.md)"
            testId="download-report"
            onClick={exportReport}
          />
          <GoabIconButton
            icon="trash"
            variant="destructive"
            title="Delete solution"
            ariaLabel="Delete solution"
            testId="delete-solution"
            onClick={() => setConfirmDelete(true)}
          />
        </Row>
      </Bar>
      <GoabModal
        testId="delete-solution-modal"
        open={confirmDelete}
        heading="Delete this solution?"
        calloutVariant="emergency"
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
        This action cannot be undone. <strong>{solution.name}</strong> and its saved specialist chats will be
        permanently removed.
      </GoabModal>
    </>
  );
};

export default SolutionHeader;
