import React, { FunctionComponent, useCallback, useEffect, useState } from 'react';
import { GoabBadge, GoabButton, GoabCircularProgress, GoabFormItem, GoabInput } from '@abgov/react-components';
import styled from 'styled-components';
import { usePlannerApi } from './api';
import { Solution } from './model';

const List = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  max-height: calc(100vh - 420px);
  min-height: 160px;
  overflow-y: auto;
  padding-right: 0.25rem;
`;

const Item = styled.button<{ selected: boolean }>`
  display: block;
  box-sizing: border-box;
  width: 100%;
  min-width: 0;
  max-width: 100%;
  text-align: left;
  font: inherit;
  cursor: pointer;
  background: var(--goa-color-greyscale-white, #fff);
  border-radius: var(--goa-border-radius-s, 0.375rem);
  border: ${({ selected }) =>
    selected
      ? '2px solid var(--goa-color-brand-default, #0081a2)'
      : '1px solid var(--goa-color-greyscale-200, #cdcdcd)'};
  padding: ${({ selected }) => (selected ? 'calc(0.75rem - 1px)' : '0.75rem')};

  &:hover {
    background: var(--goa-color-surface-item-hover, #f2f0f0);
  }
`;

const ItemName = styled.div`
  display: block;
  max-width: 230px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-weight: var(--fw-bold, 700);
`;

const ItemMeta = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-top: 0.25rem;
  color: var(--goa-color-greyscale-600, #6f6f6f);
  font-size: 0.875rem;
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

  return (
    <section aria-label="Solutions">
      <GoabFormItem label="Name for a new solution" mb="s">
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
      <GoabButton
        size="compact"
        width="100%"
        mb="m"
        testId="new-solution"
        disabled={!name.trim() || busy}
        onClick={create}
      >
        Create solution
      </GoabButton>

      {!solutions && <GoabCircularProgress visible message="Loading solutions..." size="small" />}
      {solutions?.length === 0 && <p data-testid="no-solutions">No solutions yet. Create one to get started.</p>}
      {solutions && solutions.length > 0 && (
        <List role="list" data-testid="solutions-list">
          {solutions.map((solution) => (
            <Item
              key={solution.id}
              type="button"
              role="listitem"
              selected={solution.id === selectedId}
              aria-current={solution.id === selectedId}
              data-testid={`select-solution-${solution.id}`}
              onClick={() => onSelect(solution.id)}
            >
              <ItemName title={solution.name}>{solution.name}</ItemName>
              <ItemMeta>
                <GoabBadge type="information" content={solution.status} icon={false} emphasis="subtle" />
                <span>{new Date(solution.updatedOn).toLocaleString()}</span>
              </ItemMeta>
            </Item>
          ))}
        </List>
      )}
    </section>
  );
};
