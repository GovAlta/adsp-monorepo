import React, { FunctionComponent, useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  GoabBadge,
  GoabButton,
  GoabButtonGroup,
  GoabCircularProgress,
  GoabFormItem,
  GoabInput,
  GoabModal,
  GoabTable,
  GoabTextArea,
} from '@abgov/react-components';
import { usePlannerApi } from './api';
import { Solution } from './model';

export const Solutions: FunctionComponent = () => {
  const api = usePlannerApi();
  const navigate = useNavigate();
  const [solutions, setSolutions] = useState<Solution[]>();
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState('');
  const [problem, setProblem] = useState('');
  const [busy, setBusy] = useState(false);

  const load = useCallback(() => {
    api
      .listSolutions()
      .then(setSolutions)
      .catch(() => setSolutions([]));
  }, [api]);

  useEffect(load, [load]);

  const create = async () => {
    setBusy(true);
    try {
      const solution = await api.createSolution(name.trim(), problem.trim());
      const analyzed = problem.trim() ? await api.analyze(solution.id) : solution;
      setCreating(false);
      setName('');
      setProblem('');
      navigate(`../solution/${analyzed.id}`);
    } catch {
      // Error is surfaced through the notification handled in the api hook.
    } finally {
      setBusy(false);
    }
  };

  return (
    <section>
      <GoabButton size="compact" testId="new-solution" onClick={() => setCreating(true)}>
        New solution
      </GoabButton>

      {!solutions && <GoabCircularProgress visible message="Loading solutions..." size="small" />}
      {solutions?.length === 0 && <p data-testid="no-solutions">No solutions yet. Create one to get started.</p>}
      {solutions && solutions.length > 0 && (
        <GoabTable width="100%" testId="solutions-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Status</th>
              <th>Created by</th>
              <th>Updated</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {solutions.map((solution) => (
              <tr key={solution.id}>
                <td>{solution.name}</td>
                <td>
                  <GoabBadge type="information" content={solution.status} icon={false} emphasis="subtle" />
                </td>
                <td>{solution.createdByName}</td>
                <td>{new Date(solution.updatedOn).toLocaleString()}</td>
                <td>
                  <GoabButtonGroup alignment="end">
                    <GoabButton
                      size="compact"
                      type="tertiary"
                      testId={`open-solution-${solution.id}`}
                      onClick={() => navigate(`../solution/${solution.id}`)}
                    >
                      Open
                    </GoabButton>
                    <GoabButton
                      size="compact"
                      type="tertiary"
                      variant="destructive"
                      testId={`delete-solution-${solution.id}`}
                      onClick={() => api.deleteSolution(solution.id).then(load)}
                    >
                      Delete
                    </GoabButton>
                  </GoabButtonGroup>
                </td>
              </tr>
            ))}
          </tbody>
        </GoabTable>
      )}

      <GoabModal
        testId="new-solution-modal"
        open={creating}
        heading="New solution"
        actions={
          <GoabButtonGroup alignment="end" mt="m">
            <GoabButton size="compact" type="secondary" testId="new-solution-cancel" onClick={() => setCreating(false)}>
              Cancel
            </GoabButton>
            <GoabButton size="compact" testId="new-solution-save" disabled={!name.trim() || busy} onClick={create}>
              Create and analyze
            </GoabButton>
          </GoabButtonGroup>
        }
      >
        <GoabFormItem label="Name" mb="l">
          <GoabInput
            size="compact"
            name="name"
            value={name}
            width="100%"
            testId="new-solution-name"
            aria-label="name"
            onChange={(detail) => setName(detail.value)}
          />
        </GoabFormItem>
        <GoabFormItem label="Describe the problem you are solving" helpText="Who is involved, what happens, and what outcome you need." mb="m">
          <GoabTextArea
            name="problem"
            value={problem}
            width="100%"
            rows={6}
            testId="new-solution-problem"
            aria-label="problem statement"
            onChange={(detail) => setProblem(detail.value)}
          />
        </GoabFormItem>
      </GoabModal>
    </section>
  );
};
