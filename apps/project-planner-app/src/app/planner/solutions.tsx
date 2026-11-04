import React, { FunctionComponent, useCallback, useEffect, useState } from 'react';
import {
  GoabBadge,
  GoabButton,
  GoabButtonGroup,
  GoabCircularProgress,
  GoabFormItem,
  GoabIconButton,
  GoabInput,
  GoabModal,
  GoabTable,
  GoabTableSortHeader,
} from '@abgov/react-components';
import styled from 'styled-components';
import { usePlannerApi } from './api';
import { ConfirmDelete } from './ConfirmDelete';
import { Solution } from './model';
import ProblemStatement from './ProblemStatement';
import { useBusy } from './useBusy';
import { download, safeName, solutionToMarkdown } from './utils';

const NameButton = styled.button`
  display: block;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  text-align: left;
  font: inherit;
  font-weight: var(--fw-bold, 700);
  color: var(--goa-color-interactive-default, #0070c4);
  cursor: pointer;
  background: transparent;
  border: none;
  padding: 0;

  &:hover {
    text-decoration: underline;
  }
`;

const TopRow = styled.div`
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 1rem;
  margin-bottom: 1.5rem;
`;

const SearchControls = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
`;

const SearchRow = styled.div`
  width: 280px;
`;

const CreateButtonSlot = styled.div`
  margin-left: auto;
`;

// Reserves space for everything above/below the table (header, tabs, top row, table header, pagination)
// plus a one-row safety margin so the last row never gets clipped by the viewport.
const RESERVED_HEIGHT_PX = 560;
const ROW_HEIGHT_PX = 52;
const MIN_PAGE_SIZE = 5;

interface SolutionsProps {
  selectedId?: string;
  onSelect: (id?: string) => void;
  refreshToken?: number;
}

export const Solutions: FunctionComponent<SolutionsProps> = ({ selectedId, onSelect, refreshToken }) => {
  const api = usePlannerApi();
  const [solutions, setSolutions] = useState<Solution[]>();
  const [name, setName] = useState('');
  const [problemStatement, setProblemStatement] = useState('');
  const [creating, setCreating] = useState(false);
  const [formKey, setFormKey] = useState(0);
  const [busy, run] = useBusy();
  const [deleting, setDeleting] = useState<Solution>();
  const [search, setSearch] = useState('');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc' | 'none'>('none');
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(MIN_PAGE_SIZE);

  useEffect(() => {
    const computePageSize = () => {
      const available = window.innerHeight - RESERVED_HEIGHT_PX;
      setPageSize(Math.max(MIN_PAGE_SIZE, Math.floor(available / ROW_HEIGHT_PX) - 1));
    };
    computePageSize();
    window.addEventListener('resize', computePageSize);
    return () => window.removeEventListener('resize', computePageSize);
  }, []);

  const load = useCallback(() => {
    api
      .listSolutions()
      .then(setSolutions)
      .catch(() => setSolutions([]));
  }, [api]);

  useEffect(load, [load, refreshToken]);

  useEffect(() => setPage(0), [search]);

  const filtered = (solutions || []).filter((s) => s.name.toLowerCase().includes(search.trim().toLowerCase()));
  const sorted =
    sortDirection === 'none'
      ? filtered
      : [...filtered].sort((a, b) =>
          sortDirection === 'asc' ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name),
        );
  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const currentPage = Math.min(page, totalPages - 1);
  const paged = sorted.slice(currentPage * pageSize, currentPage * pageSize + pageSize);

  const startCreate = () => {
    setCreating(true);
    setFormKey((key) => key + 1);
  };

  const cancelCreate = () => {
    setCreating(false);
    setName('');
    setProblemStatement('');
  };

  const create = () =>
    run(async () => {
      const solution = await api.createSolution(name.trim(), problemStatement.trim());
      setName('');
      setProblemStatement('');
      setCreating(false);
      await load();
      onSelect(solution.id);
    });

  const remove = () => {
    if (!deleting) {
      return;
    }
    return run(async () => {
      await api.deleteSolution(deleting.id);
      setDeleting(undefined);
      await load();
    });
  };

  const exportJson = async (solution: Solution) => {
    try {
      const data = await api.exportSolution(solution.id);
      download(`planner-${safeName(solution)}.json`, JSON.stringify(data, null, 2), 'application/json');
    } catch {
      // Error is surfaced through the notification handled in the api hook.
    }
  };

  const exportReport = async (solution: Solution) => {
    try {
      const data = (await api.exportSolution(solution.id)) as Partial<Solution>;
      download(`planner-${safeName(solution)}.md`, solutionToMarkdown({ ...solution, ...data }), 'text/markdown');
    } catch {
      // Error is surfaced through the notification handled in the api hook.
    }
  };

  return (
    <section aria-label="Solutions">
      <TopRow>
        {solutions && solutions.length > 0 && (
          <SearchControls>
            <SearchRow>
              <GoabInput
                size="compact"
                name="solutionSearch"
                value={search}
                width="100%"
                placeholder="Search solutions by name"
                ariaLabel="Search solutions by name"
                testId="solutions-search"
                onChange={(detail) => setSearch(detail.value)}
              />
            </SearchRow>
            {totalPages > 1 && (
              <>
                <GoabIconButton
                  icon="chevron-back"
                  title="Previous page"
                  ariaLabel="Previous page"
                  disabled={currentPage === 0}
                  testId="solutions-prev-page"
                  onClick={() => setPage(currentPage - 1)}
                />
                <span data-testid="solutions-page-label">
                  Page {currentPage + 1} of {totalPages}
                </span>
                <GoabIconButton
                  icon="chevron-forward"
                  title="Next page"
                  ariaLabel="Next page"
                  disabled={currentPage >= totalPages - 1}
                  testId="solutions-next-page"
                  onClick={() => setPage(currentPage + 1)}
                />
              </>
            )}
          </SearchControls>
        )}
        <CreateButtonSlot>
          <GoabButton size="compact" testId="new-solution" onClick={startCreate}>
            Create solution
          </GoabButton>
        </CreateButtonSlot>
      </TopRow>

      {!solutions && <GoabCircularProgress visible message="Loading solutions..." size="small" />}
      {solutions?.length === 0 && <p data-testid="no-solutions">No solutions yet. Create one to get started.</p>}
      {solutions &&
        solutions.length > 0 &&
        (sorted.length === 0 ? (
          <p data-testid="no-solutions-match">No solutions match &quot;{search}&quot;.</p>
        ) : (
          <GoabTable
            width="100%"
            testId="solutions-list"
            onSort={(detail) => setSortDirection(detail.sortDir === 1 ? 'asc' : 'desc')}
          >
            <thead>
              <tr>
                <th>
                  <GoabTableSortHeader name="name" direction={sortDirection} data-testid="sort-name">
                    Name
                  </GoabTableSortHeader>
                </th>
                <th>Status</th>
                <th>Created by</th>
                <th>Updated</th>
                <th>Version</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {paged.map((solution) => (
                <tr key={solution.id}>
                  <td>
                    <NameButton
                      type="button"
                      title={solution.name}
                      aria-current={solution.id === selectedId}
                      data-testid={`select-solution-${solution.id}`}
                      onClick={() => onSelect(solution.id)}
                    >
                      {solution.name}
                    </NameButton>
                  </td>
                  <td>
                    <GoabBadge type="information" content={solution.status} icon={false} emphasis="subtle" />
                  </td>
                  <td>{solution.createdByName}</td>
                  <td>{new Date(solution.updatedOn).toLocaleString()}</td>
                  <td>{solution.version}</td>
                  <td>
                    <GoabIconButton
                      icon="download"
                      title="Download JSON"
                      ariaLabel={`Download ${solution.name} as JSON`}
                      testId={`export-json-solution-${solution.id}`}
                      onClick={() => exportJson(solution)}
                    />
                    <GoabIconButton
                      icon="document-text"
                      title="Download report (.md)"
                      ariaLabel={`Download ${solution.name} report`}
                      testId={`export-report-solution-${solution.id}`}
                      onClick={() => exportReport(solution)}
                    />
                    <GoabIconButton
                      icon="trash"
                      variant="destructive"
                      title="Delete solution"
                      ariaLabel={`Delete ${solution.name}`}
                      testId={`delete-solution-${solution.id}`}
                      onClick={() => setDeleting(solution)}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </GoabTable>
        ))}

      <ConfirmDelete
        open={!!deleting}
        testIdPrefix="delete-solution"
        heading="Delete this solution?"
        busy={busy}
        onCancel={() => setDeleting(undefined)}
        onConfirm={remove}
      >
        This action cannot be undone. <strong>{deleting?.name}</strong> and its saved specialist chats will be
        permanently removed.
      </ConfirmDelete>

      <GoabModal open={creating} testId="new-solution-modal" heading="Create solution" onClose={cancelCreate}>
        <GoabFormItem label="Solution name" mb="m">
          <GoabInput
            name="newSolutionName"
            value={name}
            width="100%"
            testId="new-solution-name"
            aria-label="Solution name"
            disabled={busy}
            onChange={(detail) => setName(detail.value)}
          />
        </GoabFormItem>
        <ProblemStatement
          key={formKey}
          value={problemStatement}
          busy={busy}
          showContinue={false}
          onChange={setProblemStatement}
          onContinue={() => undefined}
        />
        <GoabButtonGroup alignment="end" mt="m">
          <GoabButton
            size="compact"
            type="secondary"
            testId="new-solution-cancel"
            disabled={busy}
            onClick={cancelCreate}
          >
            Cancel
          </GoabButton>
          <GoabButton size="compact" testId="new-solution-submit" disabled={!name.trim() || busy} onClick={create}>
            Create solution
          </GoabButton>
        </GoabButtonGroup>
      </GoabModal>
    </section>
  );
};
