import React, { FunctionComponent, useState } from 'react';
import { GoabBadge, GoabButton, GoabIconButton, GoabInput } from '@abgov/react-components';
import styled from 'styled-components';
import { PlannerApi } from './api';
import { ConfirmDelete } from './ConfirmDelete';
import { Solution } from './model';
import { useBusy } from './useBusy';
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
  hideExports?: boolean;
}

export const SolutionHeader: FunctionComponent<SolutionHeaderProps> = ({
  solution,
  api,
  onSolutionChange,
  onBack,
  hideExports = false,
}) => {
  const [renaming, setRenaming] = useState(false);
  const [name, setName] = useState(solution.name);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [working, attempt] = useBusy();

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
      const data = (await api.exportSolution(solution.id)) as Partial<Solution>;
      onSolutionChange({ ...solution, ...data });
      download(`planner-${safeName(solution)}.json`, JSON.stringify(data, null, 2), 'application/json');
    });
  const exportReport = () =>
    attempt(async () => {
      const data = (await api.exportSolution(solution.id)) as Partial<Solution>;
      const updated = { ...solution, ...data };
      onSolutionChange(updated);
      download(`planner-${safeName(solution)}.md`, solutionToMarkdown(updated), 'text/markdown');
    });
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
            <GoabBadge type="information" content={`v${solution.version}`} icon={false} testId="solution-version" />
          </Row>
        )}
        <Row role="group" aria-label={hideExports ? 'Delete solution' : 'Export and delete'}>
          {!hideExports && (
            <>
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
            </>
          )}
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
      <ConfirmDelete
        open={confirmDelete}
        testIdPrefix="delete"
        modalTestId="delete-solution-modal"
        heading="Delete this solution?"
        busy={working}
        onCancel={() => setConfirmDelete(false)}
        onConfirm={remove}
      >
        This action cannot be undone. <strong>{solution.name}</strong> and its saved specialist chats will be
        permanently removed.
      </ConfirmDelete>
    </>
  );
};

export default SolutionHeader;
