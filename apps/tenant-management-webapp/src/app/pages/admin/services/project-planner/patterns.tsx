import React, { FunctionComponent, useEffect, useState } from 'react';
import { GoabCircularProgress, GoabDetails, GoabTable } from '@abgov/react-components';
import { usePlannerApi } from './api';
import { BusinessPattern } from './model';

export const Patterns: FunctionComponent = () => {
  const api = usePlannerApi();
  const [patterns, setPatterns] = useState<BusinessPattern[]>();

  useEffect(() => {
    api
      .listPatterns()
      .then(setPatterns)
      .catch(() => setPatterns([]));
  }, [api]);

  if (!patterns) {
    return <GoabCircularProgress visible message="Loading patterns..." size="small" />;
  }

  return (
    <section>
      <p>Business patterns the planner uses to recognise your problem. Tenants can add patterns through configuration.</p>
      <GoabTable width="100%" testId="patterns-table">
        <thead>
          <tr>
            <th>Pattern</th>
            <th>Description</th>
            <th>Commonly used services</th>
          </tr>
        </thead>
        <tbody>
          {patterns.map((pattern) => (
            <tr key={pattern.id}>
              <td>{pattern.name}</td>
              <td>
                {pattern.description}
                {pattern.clarifyingQuestions?.length > 0 && (
                  <GoabDetails heading="Clarifying questions">
                    <ul>
                      {pattern.clarifyingQuestions.map((q) => (
                        <li key={q}>{q}</li>
                      ))}
                    </ul>
                  </GoabDetails>
                )}
              </td>
              <td>{pattern.serviceMappings.map((m) => m.service).join(', ')}</td>
            </tr>
          ))}
        </tbody>
      </GoabTable>
    </section>
  );
};
