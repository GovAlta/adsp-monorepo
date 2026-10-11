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
                {[
                  ['Common domain language', pattern.domainLanguage],
                  ['Common features', pattern.commonFeatures],
                  ['Strong confidence signals', pattern.strongSignals?.map((s) => s.description)],
                  ['Weak or misleading signals', pattern.weakSignals?.map((s) => s.description)],
                  ['Clarifying questions', pattern.clarifyingQuestions],
                  ['Assumptions', pattern.assumptions],
                  ['Known unknowns', pattern.knownUnknowns],
                ].map(
                  ([heading, items]: [string, string[] | undefined]) =>
                    items?.length > 0 && (
                      <GoabDetails heading={heading} key={heading}>
                        <ul>
                          {items.map((item) => (
                            <li key={item}>{item}</li>
                          ))}
                        </ul>
                      </GoabDetails>
                    ),
                )}
              </td>
              <td>
                <ul>
                  {pattern.serviceMappings.map((m) => (
                    <li key={m.service}>
                      <b>{m.service}</b>: {m.reason}
                    </li>
                  ))}
                </ul>
              </td>
            </tr>
          ))}
        </tbody>
      </GoabTable>
    </section>
  );
};
