import React, { FunctionComponent, ReactNode, useState } from 'react';
import { GoabContainer } from '@abgov/react-components';
import styled from 'styled-components';

export type Layout = 'one' | 'two';
export type SolutionMode = 'mode1' | 'mode2' | 'mode3';

export const SOLUTION_MODES: [SolutionMode, string][] = [
  ['mode2', 'Guided Discovery'],
  ['mode1', 'Rapid Recommend'],
  ['mode3', 'Option Explorer'],
];
export const LAYOUTS: [Layout, string][] = [
  ['one', 'One column'],
  ['two', 'Two columns'],
];

export const LAYOUT_KEY = 'planner-layout-v2';
export const solutionModeKey = (id: string) => `planner-solmode-${id}`;

export interface Pane {
  id: number;
  node: ReactNode;
}

/**
 * One column stacks the panes in numeric order. Two columns places the panes listed in
 * rightIds on the right and the rest on the left.
 */
export function layoutPanes(layout: Layout, panes: Pane[], rightIds: number[] = [3, 5]): Pane[][] {
  const sorted = panes.filter((pane) => !!pane.node).sort((a, b) => a.id - b.id);
  if (layout === 'one') {
    return [sorted];
  }
  return [sorted.filter((pane) => !rightIds.includes(pane.id)), sorted.filter((pane) => rightIds.includes(pane.id))];
}

const Columns = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(380px, 1fr));
  gap: 1rem;
  align-items: start;
  > * {
    min-width: 0;
  }
`;

const Stack = styled.div`
  overflow-wrap: anywhere;
  > section + section {
    margin-top: 1.5rem;
  }
`;

interface PaneLayoutProps {
  layout: Layout;
  panes: Pane[];
  rightIds?: number[];
}

export const PaneLayout: FunctionComponent<PaneLayoutProps> = ({ layout, panes, rightIds }) => {
  const columns = layoutPanes(layout, panes, rightIds);
  const content = columns.map((column, i) => (
    <GoabContainer key={i} accent="thin">
      <Stack data-testid={`pane-column-${i}`}>
        {column.map((pane) => (
          <section key={pane.id} data-testid={`pane-${pane.id}`}>
            {pane.node}
          </section>
        ))}
      </Stack>
    </GoabContainer>
  ));

  return layout === 'one' ? <>{content}</> : <Columns>{content}</Columns>;
};

function readStored<T extends string>(key: string, allowed: T[], fallback: T): T {
  try {
    const value = localStorage.getItem(key) as T;
    return allowed.includes(value) ? value : fallback;
  } catch {
    return fallback;
  }
}

function usePersisted<T extends string>(key: string, allowed: T[], fallback: T): [T, (value: T) => void] {
  const [state, setState] = useState<{ key: string; value: T }>({ key, value: readStored(key, allowed, fallback) });
  // Re-read when the key changes (for example when switching solution).
  const current = state.key === key ? state.value : readStored(key, allowed, fallback);
  const update = (value: T) => {
    try {
      localStorage.setItem(key, value);
    } catch {
      // Storage unavailable; keep the preference for this session only.
    }
    setState({ key, value });
  };
  return [current, update];
}

export const usePersistedLayout = () =>
  usePersisted<Layout>(
    LAYOUT_KEY,
    LAYOUTS.map(([id]) => id),
    'one'
  );

export const usePersistedSolutionMode = (solutionId: string) =>
  usePersisted<SolutionMode>(
    solutionModeKey(solutionId),
    SOLUTION_MODES.map(([id]) => id),
    'mode2'
  );
