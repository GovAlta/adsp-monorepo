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
} from '@abgov/react-components';
import styled from 'styled-components';
import { usePlannerApi } from './api';
import { Solution } from './model';

const NewSolution = styled.div`
  display: flex;
  align-items: flex-end;
  gap: 0.5rem;
  max-width: 420px;
  margin-bottom: 1.5rem;

  > *:first-child {
    flex: 1;
    min-width: 0;
  }
`;

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

interface SolutionsProps {
  selectedId?: string;
  onSelect: (id?: string) => void;
  refreshToken?: number;
}

export const Solutions: FunctionComponent<SolutionsProps> = ({ selectedId, onSelect, refreshToken }) => {
  const api = usePlannerApi();
  const [solutions, setSolutions] = useState<Solution[]>();
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);
  const [deleting, setDeleting] = useState<Solution>();

  const load = useCallback(() => {
    api
      .listSolutions()
      .then(setSolutions)
      .catch(() => setSolutions([]));
  }, [api]);

  useEffect(load, [load, refreshToken]);

  const create = async () => {
    setBusy(true);
    try {
      const solution = await api.createSolution(name.trim(), '');
      setName('');
      await load();
      onSelect(solution.id);
    } catch {
      // Error is surfaced through the notification handled in the api hook.
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    if (!deleting) {
      return;
    }
    setBusy(true);
    try {
      await api.deleteSolution(deleting.id);
      setDeleting(undefined);
      await load();
    } catch {
      // Error is surfaced through the notification handled in the api hook.
    } finally {
      setBusy(false);
    }
  };

  return (
    <section aria-label="Solutions">
      <NewSolution>
        <GoabFormItem label="Name for a new solution">
          <GoabInput
            size="compact"
            name="newSolutionName"
            value={name}
            width="100%"
            testId="new-solution-name"
            aria-label="Name for a new solution"
            onChange={(detail) => setName(detail.value)}
          />
        </GoabFormItem>
        <GoabButton size="compact" testId="new-solution" disabled={!name.trim() || busy} onClick={create}>
          Create solution
        </GoabButton>
      </NewSolution>

      {!solutions && <GoabCircularProgress visible message="Loading solutions..." size="small" />}
      {solutions?.length === 0 && <p data-testid="no-solutions">No solutions yet. Create one to get started.</p>}
      {solutions && solutions.length > 0 && (
        <GoabTable width="100%" testId="solutions-list">
          <thead>
            <tr>
              <th>Name</th>
              <th>Status</th>
              <th>Created by</th>
              <th>Updated</th>
              <th>Revision</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {solutions.map((solution) => (
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
                <td>{solution.revision}</td>
                <td>
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
      )}

      <GoabModal
        testId="delete-solution-modal"
        open={!!deleting}
        heading="Delete this solution?"
        calloutVariant="emergency"
        onClose={() => setDeleting(undefined)}
        actions={
          <GoabButtonGroup alignment="end" mt="m">
            <GoabButton
              size="compact"
              type="secondary"
              testId="delete-solution-cancel"
              onClick={() => setDeleting(undefined)}
            >
              Cancel
            </GoabButton>
            <GoabButton
              size="compact"
              variant="destructive"
              testId="delete-solution-confirm"
              disabled={busy}
              onClick={remove}
            >
              Delete
            </GoabButton>
          </GoabButtonGroup>
        }
      >
        This action cannot be undone. <strong>{deleting?.name}</strong> and its saved specialist chats will be
        permanently removed.
      </GoabModal>
    </section>
  );
};
