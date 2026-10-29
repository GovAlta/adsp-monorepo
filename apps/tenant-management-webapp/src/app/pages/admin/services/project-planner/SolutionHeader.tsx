import React, { FunctionComponent, useCallback, useEffect, useState } from 'react';
import { GoabBadge, GoabButton, GoabIconButton, GoabInput } from '@abgov/react-components';
import styled from 'styled-components';
import { PlannerApi } from './api';
import { ConfirmDelete } from './ConfirmDelete';
import { Solution, SolutionVersionList } from './model';
import { useBusy } from './useBusy';
import { download, harnessToMarkdown, safeName, solutionToMarkdown } from './utils';
import { VersionsModal } from './VersionsModal';

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

const LeftGroup = styled.div`
  display: flex;
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
  disabled?: boolean;
  onBusyChange?: (busy: boolean) => void;
  // Bumped when something outside the solution record changes, such as a specialist chat.
  versionsToken?: number;
}

export const SolutionHeader: FunctionComponent<SolutionHeaderProps> = ({
  solution,
  api,
  onSolutionChange,
  onBack,
  hideExports = false,
  disabled = false,
  onBusyChange,
  versionsToken,
}) => {
  const [renaming, setRenaming] = useState(false);
  const [name, setName] = useState(solution.name);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [versions, setVersions] = useState<SolutionVersionList>();
  const [showVersions, setShowVersions] = useState(false);
  const [working, attempt] = useBusy();
  const blocked = working || disabled;

  useEffect(() => {
    onBusyChange?.(working);
  }, [working, onBusyChange]);

  const loadVersions = useCallback(async () => {
    try {
      setVersions(await api.listVersions(solution.id));
    } catch {
      // The api already reports the error; keep the last known status.
    }
  }, [api, solution.id]);

  useEffect(() => {
    loadVersions();
  }, [loadVersions, solution.updatedOn, versionsToken]);

  const startRename = () => {
    setName(solution.name);
    setRenaming(true);
  };
  const saveName = () =>
    attempt(async () => {
      onSolutionChange(await api.updateSolution(solution.id, { name: name.trim() }));
      setRenaming(false);
    });
  const saveVersion = () =>
    attempt(async () => {
      try {
        await api.saveVersion(solution.id);
      } finally {
        await loadVersions();
      }
    });
  const fetchExport = async () => (await api.exportSolution(solution.id)) as Partial<Solution>;
  const exportJson = () =>
    attempt(async () => {
      const data = await fetchExport();
      download(`planner-${safeName(solution)}.json`, JSON.stringify(data, null, 2), 'application/json');
    });
  const exportReport = () =>
    attempt(async () => {
      const data = await fetchExport();
      download(`planner-${safeName(solution)}.md`, solutionToMarkdown({ ...solution, ...data }), 'text/markdown');
    });
  const exportHarness = () =>
    attempt(async () => {
      const data = await fetchExport();
      download(
        `planner-${safeName(solution)}-harness.md`,
        harnessToMarkdown({ ...solution, ...data }),
        'text/markdown',
      );
    });
  const remove = () =>
    attempt(async () => {
      await api.deleteSolution(solution.id);
      setConfirmDelete(false);
      onBack?.();
    });

  return (
    <>
      <Bar>
        <LeftGroup>
          {onBack && (
            <GoabIconButton
              icon="arrow-back"
              title="Back to solutions"
              ariaLabel="Back to solutions"
              testId="back-to-solutions"
              onClick={onBack}
            />
          )}
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
              <GoabButton size="compact" testId="rename-save" disabled={blocked || !name.trim()} onClick={saveName}>
                Save
              </GoabButton>
              <GoabButton
                size="compact"
                type="tertiary"
                testId="rename-cancel"
                disabled={blocked}
                onClick={() => setRenaming(false)}
              >
                Cancel
              </GoabButton>
            </RenameRow>
          ) : (
            <Row>
              <h2 style={{ margin: 0, overflowWrap: 'anywhere', minWidth: 0 }} data-testid="solution-title">
                {solution.name}
              </h2>
              <GoabIconButton
                icon="pencil"
                title="Edit solution name"
                ariaLabel="Edit solution name"
                testId="rename-solution"
                disabled={blocked}
                onClick={startRename}
              />
              <GoabBadge type="information" content={solution.status} icon={false} />
              <GoabBadge
                type="information"
                content={`v${versions?.latest ?? solution.version}`}
                icon={false}
                testId="solution-version"
              />
            </Row>
          )}
        </LeftGroup>
        <Row role="group" aria-label={hideExports ? 'Versions and delete' : 'Versions, export and delete'}>
          <GoabButton
            size="compact"
            testId="save-version"
            disabled={blocked || !versions?.unsavedChanges}
            onClick={saveVersion}
          >
            Save version
          </GoabButton>
          <GoabButton size="compact" type="secondary" testId="open-versions" onClick={() => setShowVersions(true)}>
            Versions
          </GoabButton>
          {!hideExports && (
            <>
              <GoabIconButton
                icon="download"
                title="Download JSON"
                ariaLabel="Download JSON"
                testId="download-json"
                disabled={blocked}
                onClick={exportJson}
              />
              <GoabIconButton
                icon="document-text"
                title="Download report (.md)"
                ariaLabel="Download report (.md)"
                testId="download-report"
                disabled={blocked}
                onClick={exportReport}
              />
              <GoabIconButton
                icon="code-download"
                title="Download harness instructions"
                ariaLabel="Download harness instructions"
                testId="download-harness"
                disabled={blocked}
                onClick={exportHarness}
              />
            </>
          )}
          <GoabIconButton
            icon="trash"
            variant="destructive"
            title="Delete solution"
            ariaLabel="Delete solution"
            testId="delete-solution"
            disabled={blocked}
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
      <VersionsModal
        open={showVersions}
        solution={solution}
        api={api}
        versions={versions?.results ?? []}
        onClose={() => setShowVersions(false)}
        onRenamed={loadVersions}
      />
    </>
  );
};

export default SolutionHeader;
