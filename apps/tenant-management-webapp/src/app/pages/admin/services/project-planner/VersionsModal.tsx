import React, { FunctionComponent, useState } from 'react';
import { GoabButton, GoabButtonGroup, GoabIconButton, GoabInput, GoabModal, GoabTable } from '@abgov/react-components';
import styled from 'styled-components';
import { PlannerApi } from './api';
import { Solution, SolutionVersionSummary } from './model';
import { useBusy } from './useBusy';
import { download, harnessToMarkdown, safeName, solutionToMarkdown } from './utils';

const pad = (value: number) => String(value).padStart(2, '0');
const fmtTimestamp = (iso: string) => {
  const date = new Date(iso);
  const hour = date.getHours() % 12 || 12;
  const meridiem = date.getHours() < 12 ? 'AM' : 'PM';
  return `${pad(date.getMonth() + 1)}-${pad(date.getDate())}-${date.getFullYear()}, ${hour}:${pad(date.getMinutes())} ${meridiem}`;
};

const Scroll = styled.div`
  max-height: 60vh;
  overflow-y: auto;
`;

const Cell = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.5rem;
`;

const NameEditor = styled.div`
  display: inline-flex;
  flex-direction: column;
  gap: 0.5rem;
`;

interface VersionsModalProps {
  open: boolean;
  solution: Solution;
  api: PlannerApi;
  versions: SolutionVersionSummary[];
  onClose: () => void;
  onRenamed: () => void;
}

export const VersionsModal: FunctionComponent<VersionsModalProps> = ({
  open,
  solution,
  api,
  versions,
  onClose,
  onRenamed,
}) => {
  const [editing, setEditing] = useState<number>();
  const [name, setName] = useState('');
  const [working, attempt] = useBusy();

  const startRename = (version: SolutionVersionSummary) => {
    setName(version.name);
    setEditing(version.number);
  };
  const saveName = (number: number) =>
    attempt(async () => {
      await api.renameVersion(solution.id, number, name.trim());
      setEditing(undefined);
      onRenamed();
    });
  const fetchExport = async (number: number) => (await api.exportVersion(solution.id, number)) as Partial<Solution>;
  const fileName = (number: number) => `planner-${safeName(solution)}-v${number}`;
  const exportJson = (number: number) =>
    attempt(async () => {
      const data = await fetchExport(number);
      download(`${fileName(number)}.json`, JSON.stringify(data, null, 2), 'application/json');
    });
  const exportReport = (number: number) =>
    attempt(async () => {
      const data = await fetchExport(number);
      download(`${fileName(number)}.md`, solutionToMarkdown({ ...solution, ...data }), 'text/markdown');
    });
  const exportHarness = (number: number) =>
    attempt(async () => {
      const data = await fetchExport(number);
      download(
        `${fileName(number)}-harness.md`,
        harnessToMarkdown({ ...solution, ...data }, fileName(number)),
        'text/markdown',
      );
    });

  return (
    <GoabModal
      open={open}
      testId="versions-modal"
      heading="Versions"
      maxWidth="960px"
      onClose={onClose}
      actions={
        <GoabButtonGroup alignment="end" mt="m">
          <GoabButton size="compact" type="secondary" testId="versions-close" onClick={onClose}>
            Close
          </GoabButton>
        </GoabButtonGroup>
      }
    >
      <Scroll data-testid="versions-scroll">
        <GoabTable width="100%" testId="versions-table">
          <thead>
            <tr>
              <th>Version</th>
              <th>Name</th>
              <th>Timestamp</th>
              <th>Export</th>
            </tr>
          </thead>
          <tbody>
            {versions.map((version) => (
              <tr key={version.number}>
                <td>{version.number}</td>
                <td>
                  {editing === version.number ? (
                    <NameEditor>
                      <GoabInput
                        name="versionName"
                        value={name}
                        maxLength={100}
                        testId="version-name-input"
                        ariaLabel={`Name for version ${version.number}`}
                        onChange={(detail) => setName(detail.value)}
                      />
                      <GoabButtonGroup alignment="end" gap="compact" testId="version-name-actions">
                        <GoabButton
                          size="compact"
                          type="tertiary"
                          testId="version-name-cancel"
                          disabled={working}
                          onClick={() => setEditing(undefined)}
                        >
                          Cancel
                        </GoabButton>
                        <GoabButton
                          size="compact"
                          testId="version-name-save"
                          disabled={working}
                          onClick={() => saveName(version.number)}
                        >
                          Save
                        </GoabButton>
                      </GoabButtonGroup>
                    </NameEditor>
                  ) : (
                    <Cell>
                      {version.name}
                      <GoabIconButton
                        icon="pencil"
                        size="small"
                        title="Rename version"
                        ariaLabel={`Rename version ${version.number}`}
                        testId={`rename-version-${version.number}`}
                        disabled={working}
                        onClick={() => startRename(version)}
                      />
                    </Cell>
                  )}
                </td>
                <td>{fmtTimestamp(version.createdOn)}</td>
                <td>
                  <Cell role="group" aria-label={`Export version ${version.number}`}>
                    <GoabIconButton
                      icon="download"
                      title="Download JSON"
                      ariaLabel={`Download version ${version.number} as JSON`}
                      testId={`version-json-${version.number}`}
                      disabled={working}
                      onClick={() => exportJson(version.number)}
                    />
                    <GoabIconButton
                      icon="document-text"
                      title="Download report (.md)"
                      ariaLabel={`Download version ${version.number} report`}
                      testId={`version-report-${version.number}`}
                      disabled={working}
                      onClick={() => exportReport(version.number)}
                    />
                    <GoabIconButton
                      icon="code-download"
                      title="Download harness instructions"
                      ariaLabel={`Download version ${version.number} harness instructions`}
                      testId={`version-harness-${version.number}`}
                      disabled={working}
                      onClick={() => exportHarness(version.number)}
                    />
                  </Cell>
                </td>
              </tr>
            ))}
          </tbody>
        </GoabTable>
      </Scroll>
    </GoabModal>
  );
};

export default VersionsModal;
