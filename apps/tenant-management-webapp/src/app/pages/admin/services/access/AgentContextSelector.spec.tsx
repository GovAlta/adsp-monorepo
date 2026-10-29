import React from 'react';
import { fireEvent, render } from '@testing-library/react';
import '@testing-library/jest-dom';
import { AgentContextSelector, QUESTION_HIERARCHY } from './AgentContextSelector';

describe('AgentContextSelector', () => {
  it('routes every My Clients question to the Access Service agent so it uses its client tools', () => {
    const subtopics = Object.values(QUESTION_HIERARCHY['my-clients'].subtopics);

    expect(subtopics.map(({ label }) => label)).toEqual([
      'List Clients',
      'Inspect a Client',
      'Redirect URIs & Web Origins',
      'Roles, Scopes & Mappers',
    ]);
    expect(subtopics.every(({ agent }) => agent === 'AccessServiceAgent')).toBe(true);
  });

  it('asks a My Clients question with its routing hint', () => {
    const onAskQuestion = jest.fn();
    const { container, getByText } = render(<AgentContextSelector onAskQuestion={onAskQuestion} />);

    fireEvent.change(container.querySelector('#topic-select'), { target: { value: 'my-clients' } });
    fireEvent.click(getByText('List Clients'));

    expect(onAskQuestion).toHaveBeenCalledWith('List the clients in my realm.', {
      context: 'my-clients',
      subtopic: 'list-clients',
      agent: 'AccessServiceAgent',
    });
  });
});
