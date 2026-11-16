import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { AgentContextSelector, QUESTION_HIERARCHY } from './AgentContextSelector';
import { isTemplatedQuestion, PredefinedQuestion, TemplatedQuestion } from './predefinedQuestion';

const ACCESS_SERVICE_AGENT = 'AccessServiceAgent';

type QuestionCase = [topic: string, subtopic: string, question: PredefinedQuestion];

const ALL_QUESTIONS: QuestionCase[] = Object.entries(QUESTION_HIERARCHY).flatMap(([topic, { subtopics }]) =>
  Object.entries(subtopics).map(([subtopic, question]): QuestionCase => [topic, subtopic, question]),
);
const PLAIN_QUESTIONS = ALL_QUESTIONS.filter(([, , question]) => !isTemplatedQuestion(question));
const TEMPLATED_QUESTIONS = ALL_QUESTIONS.filter(([, , question]) => isTemplatedQuestion(question));

function labelsOf(topic: string): string[] {
  return Object.values(QUESTION_HIERARCHY[topic].subtopics).map(({ label }) => label);
}

function renderSelector(topic?: string) {
  const onAskQuestion = jest.fn();
  const rendered = render(<AgentContextSelector onAskQuestion={onAskQuestion} />);
  if (topic) {
    chooseTopic(rendered.container, topic);
  }
  return { ...rendered, onAskQuestion };
}

function chooseTopic(container: HTMLElement, topic: string) {
  fireEvent.change(container.querySelector('#topic-select') as Element, { target: { value: topic } });
}

function clickQuestion(label: string) {
  fireEvent.click(screen.getByRole('button', { name: label }));
}

function form(container: HTMLElement): Element | null {
  return container.querySelector('[data-testid="predefined-question-form"]');
}

function inputFor(container: HTMLElement, name: string): Element {
  return container.querySelector(`goa-input[testid="predefined-question-input-${name}"]`) as Element;
}

function typeInto(container: HTMLElement, name: string, value: string) {
  fireEvent(inputFor(container, name), new CustomEvent('_change', { detail: { name, value } }));
}

function clickFormButton(container: HTMLElement, testId: string) {
  fireEvent(container.querySelector(`goa-button[testid="${testId}"]`) as Element, new CustomEvent('_click'));
}

// Fills every input the question needs with a representative username and asks it.
function fillAndAsk(container: HTMLElement, question: TemplatedQuestion) {
  question.inputs.forEach(({ name }) => typeInto(container, name, 'jane.doe@gov.ab.ca'));
  clickFormButton(container, 'predefined-question-ask');
}

describe('AgentContextSelector', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('question hierarchy', () => {
    it('lists the My Clients questions', () => {
      // Act
      const labels = labelsOf('my-clients');

      // Assert
      expect(labels).toEqual([
        'List Clients',
        'Inspect a Client',
        'Redirect URIs & Web Origins',
        'Roles, Scopes & Mappers',
        'Sign-in Address Error',
        'Preview a Token',
      ]);
    });

    it('lists the My Users & Roles questions', () => {
      // Act
      const labels = labelsOf('my-users');

      // Assert
      expect(labels).toEqual([
        'Find a User',
        'User Role Assignments',
        'Compare Two Users',
        'Who Has a Role',
        'What a Role Means',
      ]);
    });

    it('lists the common beginner questions first', () => {
      // Act
      const [firstTopic] = Object.keys(QUESTION_HIERARCHY);

      // Assert
      expect(firstTopic).toBe('common-questions');
    });

    it('lists the common beginner questions, answered with the live tools', () => {
      // Act
      const labels = labelsOf('common-questions');

      // Assert
      expect(labels).toEqual([
        'Is Someone an Admin?',
        "Why Can't Someone Sign In?",
        'Why "Access Denied"?',
        'Who Has Admin?',
        'Is My App Set Up Right?',
        'What Can My Service Call?',
      ]);
    });

    it('answers none of the common beginner questions from the guide, so they use the live tools', () => {
      // Act
      const guideTopics = Object.values(QUESTION_HIERARCHY['common-questions'].subtopics).filter(
        (question) => 'guideTopic' in question,
      );

      // Assert
      expect(guideTopics).toEqual([]);
    });

    it.each(TEMPLATED_QUESTIONS)('uses every input of the %s / %s question in its template', (_t, _s, question) => {
      // Arrange
      const { inputs, template } = question as TemplatedQuestion;

      // Act
      const placeholders = Array.from(template.matchAll(/\{(\w+)\}/g), ([, name]) => name).sort();

      // Assert
      expect(placeholders).toEqual(inputs.map(({ name }) => name).sort());
    });
  });

  describe('routing', () => {
    it.each(PLAIN_QUESTIONS)('routes the %s / %s question to the Access Service agent', (topic, subtopic, question) => {
      // Arrange
      const { onAskQuestion } = renderSelector(topic);

      // Act
      clickQuestion(question.label);

      // Assert
      expect(onAskQuestion.mock.calls[0][1]).toEqual({ context: topic, subtopic, agent: ACCESS_SERVICE_AGENT });
    });

    it.each(TEMPLATED_QUESTIONS)(
      'routes the %s / %s question to the Access Service agent once its names are filled in',
      (topic, subtopic, question) => {
        // Arrange
        const { container, onAskQuestion } = renderSelector(topic);
        clickQuestion(question.label);

        // Act
        fillAndAsk(container, question as TemplatedQuestion);

        // Assert
        expect(onAskQuestion.mock.calls[0][1]).toEqual({ context: topic, subtopic, agent: ACCESS_SERVICE_AGENT });
      },
    );

    it('asks a My Clients question with its routing hint and no guide topic', () => {
      // Arrange
      const { onAskQuestion } = renderSelector('my-clients');

      // Act
      clickQuestion('List Clients');

      // Assert
      expect(onAskQuestion).toHaveBeenCalledWith(
        'List the clients in my realm.',
        { context: 'my-clients', subtopic: 'list-clients', agent: ACCESS_SERVICE_AGENT },
        undefined,
      );
    });

    it.each([
      ['tokens', 'Token Expiry', 'token-expiry'],
      ['overview', 'Environments', 'environments'],
      ['infrastructure', 'Access Service Infrastructure', 'architecture'],
    ])('passes the guide topic of the %s question "%s" so it is answered without AI', (topic, label, guideTopic) => {
      // Arrange
      const { onAskQuestion } = renderSelector(topic);

      // Act
      clickQuestion(label);

      // Assert
      expect(onAskQuestion.mock.calls[0][2]).toBe(guideTopic);
    });

    it('does not ask anything while disabled', () => {
      // Arrange
      const onAskQuestion = jest.fn();
      const { container } = render(<AgentContextSelector onAskQuestion={onAskQuestion} disabled />);
      chooseTopic(container, 'my-clients');

      // Act
      clickQuestion('List Clients');

      // Assert
      expect(onAskQuestion).not.toHaveBeenCalled();
    });
  });

  describe('question form', () => {
    it('opens a form when a question that names someone is clicked', () => {
      // Arrange
      const { container } = renderSelector('common-questions');

      // Act
      clickQuestion('Is Someone an Admin?');

      // Assert
      expect(form(container)).toHaveTextContent('Is Someone an Admin?');
    });

    it('does not ask a question that names someone until its form is filled in', () => {
      // Arrange
      const { onAskQuestion } = renderSelector('common-questions');

      // Act
      clickQuestion('Is Someone an Admin?');

      // Assert
      expect(onAskQuestion).not.toHaveBeenCalled();
    });

    it('marks the question as expanded while its form is open', () => {
      // Arrange
      renderSelector('common-questions');

      // Act
      clickQuestion('Is Someone an Admin?');

      // Assert
      expect(screen.getByRole('button', { name: 'Is Someone an Admin?' })).toHaveAttribute('aria-expanded', 'true');
    });

    it('shows no form for a question that needs no names', () => {
      // Arrange
      const { container } = renderSelector('common-questions');

      // Act
      clickQuestion('Who Has Admin?');

      // Assert
      expect(form(container)).toBeNull();
    });

    it('says a name is required when Ask is clicked with it empty', () => {
      // Arrange
      const { container } = renderSelector('common-questions');
      clickQuestion('Is Someone an Admin?');

      // Act
      clickFormButton(container, 'predefined-question-ask');

      // Assert
      expect(container.querySelector('goa-form-item[label="Username or email"]')).toHaveAttribute(
        'error',
        'Username or email is required.',
      );
    });

    it('sends the question with the trimmed names filled in and its routing hint', () => {
      // Arrange
      const { container, onAskQuestion } = renderSelector('common-questions');
      clickQuestion('Why "Access Denied"?');
      typeInto(container, 'person', '  jane.doe@gov.ab.ca ');
      typeInto(container, 'service', ' form-service ');

      // Act
      clickFormButton(container, 'predefined-question-ask');

      // Assert
      expect(onAskQuestion).toHaveBeenCalledWith(
        'jane.doe@gov.ab.ca gets access denied in form-service. What are they missing?',
        { context: 'common-questions', subtopic: 'access-denied', agent: ACCESS_SERVICE_AGENT },
      );
    });

    it('closes the form once the question is asked', () => {
      // Arrange
      const { container } = renderSelector('my-users');
      clickQuestion('Who Has a Role');
      typeInto(container, 'role', 'form-admin');

      // Act
      clickFormButton(container, 'predefined-question-ask');

      // Assert
      expect(form(container)).toBeNull();
    });

    it('closes the form on Escape', () => {
      // Arrange
      const { container } = renderSelector('common-questions');
      clickQuestion('Is Someone an Admin?');

      // Act
      fireEvent(
        inputFor(container, 'person'),
        new CustomEvent('_keyPress', { detail: { name: 'person', value: '', key: 'Escape' } }),
      );

      // Assert
      expect(form(container)).toBeNull();
    });

    it('closes the form when Cancel is clicked', () => {
      // Arrange
      const { container } = renderSelector('common-questions');
      clickQuestion('Is Someone an Admin?');

      // Act
      clickFormButton(container, 'predefined-question-cancel');

      // Assert
      expect(form(container)).toBeNull();
    });

    it('does not ask anything when the form is cancelled', () => {
      // Arrange
      const { container, onAskQuestion } = renderSelector('common-questions');
      clickQuestion('Is Someone an Admin?');
      typeInto(container, 'person', 'jane.doe@gov.ab.ca');

      // Act
      clickFormButton(container, 'predefined-question-cancel');

      // Assert
      expect(onAskQuestion).not.toHaveBeenCalled();
    });

    it('closes the form when another topic is chosen', () => {
      // Arrange
      const { container } = renderSelector('common-questions');
      clickQuestion('Is Someone an Admin?');

      // Act
      chooseTopic(container, 'tokens');

      // Assert
      expect(form(container)).toBeNull();
    });

    it('closes the form when a question that needs no names is asked instead', () => {
      // Arrange
      const { container } = renderSelector('common-questions');
      clickQuestion('Is Someone an Admin?');

      // Act
      clickQuestion('Who Has Admin?');

      // Assert
      expect(form(container)).toBeNull();
    });

    it('starts the form empty when another question that names someone is chosen', () => {
      // Arrange
      const { container } = renderSelector('common-questions');
      clickQuestion('Is Someone an Admin?');
      typeInto(container, 'person', 'jane.doe@gov.ab.ca');

      // Act
      clickQuestion("Why Can't Someone Sign In?");

      // Assert
      expect(inputFor(container, 'person')).toHaveAttribute('value', '');
    });
  });
});
