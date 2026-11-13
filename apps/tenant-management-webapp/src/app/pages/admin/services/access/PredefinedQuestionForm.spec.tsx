import React from 'react';
import { fireEvent, render } from '@testing-library/react';
import '@testing-library/jest-dom';
import { PredefinedQuestionForm } from './PredefinedQuestionForm';
import { TemplatedQuestion } from './predefinedQuestion';

const ACCESS_DENIED_QUESTION: TemplatedQuestion = {
  label: 'Why "Access Denied"?',
  question:
    'Someone gets an access denied or 403 error in an app or ADSP service. Help me find out what they are missing.',
  inputs: [
    { name: 'person', label: 'Username or email', placeholder: 'jane.doe@gov.ab.ca' },
    { name: 'service', label: 'App or ADSP service', placeholder: 'form-service' },
  ],
  template: '{person} gets access denied in {service}. What are they missing?',
};

function renderForm({ disabled = false } = {}) {
  const onAsk = jest.fn();
  const onCancel = jest.fn();
  const { container } = render(
    <PredefinedQuestionForm question={ACCESS_DENIED_QUESTION} disabled={disabled} onAsk={onAsk} onCancel={onCancel} />,
  );
  return { container, onAsk, onCancel };
}

function inputFor(container: HTMLElement, name: string): Element {
  return container.querySelector(`goa-input[testid="predefined-question-input-${name}"]`) as Element;
}

function typeInto(container: HTMLElement, name: string, value: string) {
  fireEvent(inputFor(container, name), new CustomEvent('_change', { detail: { name, value } }));
}

function pressKey(container: HTMLElement, name: string, key: string, value: string) {
  fireEvent(inputFor(container, name), new CustomEvent('_keyPress', { detail: { name, value, key } }));
}

function clickButton(container: HTMLElement, testId: string) {
  fireEvent(container.querySelector(`goa-button[testid="${testId}"]`) as Element, new CustomEvent('_click'));
}

function errorFor(container: HTMLElement, label: string): string | null | undefined {
  return container.querySelector(`goa-form-item[label="${label}"]`)?.getAttribute('error');
}

describe('PredefinedQuestionForm', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  it('shows the question it asks for names for', () => {
    // Act
    const { container } = renderForm();

    // Assert
    expect(container.querySelector('strong')).toHaveTextContent('Why "Access Denied"?');
  });

  it('shows a required input for each name the question needs', () => {
    // Act
    const { container } = renderForm();

    // Assert
    const formItems = Array.from(container.querySelectorAll('goa-form-item'));
    expect(formItems.map((item) => [item.getAttribute('label'), item.getAttribute('requirement')])).toEqual([
      ['Username or email', 'required'],
      ['App or ADSP service', 'required'],
    ]);
  });

  it('focuses the first input so the user can start typing', () => {
    // Act
    const { container } = renderForm();

    // Assert
    expect(inputFor(container, 'person')).toHaveAttribute('focused', 'true');
  });

  it.each([
    ['Username or email', 'Username or email is required.'],
    ['App or ADSP service', 'App or ADSP service is required.'],
  ])('says "%s" is required when Ask is clicked with it empty', (label, error) => {
    // Arrange
    const { container } = renderForm();

    // Act
    clickButton(container, 'predefined-question-ask');

    // Assert
    expect(errorFor(container, label)).toBe(error);
  });

  it('marks an empty input as in error once Ask is clicked', () => {
    // Arrange
    const { container } = renderForm();

    // Act
    clickButton(container, 'predefined-question-ask');

    // Assert
    expect(inputFor(container, 'person')).toHaveAttribute('error', 'true');
  });

  it('does not ask while a required input is empty', () => {
    // Arrange
    const { container, onAsk } = renderForm();
    typeInto(container, 'person', 'jane.doe@gov.ab.ca');

    // Act
    clickButton(container, 'predefined-question-ask');

    // Assert
    expect(onAsk).not.toHaveBeenCalled();
  });

  it('treats an input holding only spaces as empty', () => {
    // Arrange
    const { container } = renderForm();
    typeInto(container, 'person', 'jane.doe@gov.ab.ca');
    typeInto(container, 'service', '   ');

    // Act
    clickButton(container, 'predefined-question-ask');

    // Assert
    expect(errorFor(container, 'App or ADSP service')).toBe('App or ADSP service is required.');
  });

  it('asks the question with the typed names filled in and trimmed', () => {
    // Arrange
    const { container, onAsk } = renderForm();
    typeInto(container, 'person', '  jane.doe@gov.ab.ca ');
    typeInto(container, 'service', ' form-service ');

    // Act
    clickButton(container, 'predefined-question-ask');

    // Assert
    expect(onAsk).toHaveBeenCalledWith('jane.doe@gov.ab.ca gets access denied in form-service. What are they missing?');
  });

  it('clears an error once the input is filled in and Ask is clicked again', () => {
    // Arrange
    const { container } = renderForm();
    clickButton(container, 'predefined-question-ask');
    typeInto(container, 'person', 'jane.doe@gov.ab.ca');

    // Act
    clickButton(container, 'predefined-question-ask');

    // Assert
    expect(errorFor(container, 'Username or email')).toBeNull();
  });

  it('asks on Enter using the value the key press carries, which can be newer than the last change', () => {
    // Arrange
    const { container, onAsk } = renderForm();
    typeInto(container, 'person', 'jane.doe@gov.ab.ca');
    typeInto(container, 'service', 'form');

    // Act
    pressKey(container, 'service', 'Enter', 'form-service');

    // Assert
    expect(onAsk).toHaveBeenCalledWith('jane.doe@gov.ab.ca gets access denied in form-service. What are they missing?');
  });

  it('shows the required errors on Enter instead of asking', () => {
    // Arrange
    const { container, onAsk } = renderForm();

    // Act
    pressKey(container, 'person', 'Enter', 'jane.doe@gov.ab.ca');

    // Assert
    expect(onAsk).not.toHaveBeenCalled();
  });

  it('does not ask on Enter while the chat is disabled', () => {
    // Arrange
    const { container, onAsk } = renderForm({ disabled: true });
    typeInto(container, 'person', 'jane.doe@gov.ab.ca');

    // Act
    pressKey(container, 'service', 'Enter', 'form-service');

    // Assert
    expect(onAsk).not.toHaveBeenCalled();
  });

  it('disables Ask while the chat is disabled', () => {
    // Act
    const { container } = renderForm({ disabled: true });

    // Assert
    expect(container.querySelector('goa-button[testid="predefined-question-ask"]')).toHaveAttribute('disabled', 'true');
  });

  it('cancels on Escape', () => {
    // Arrange
    const { container, onCancel } = renderForm();

    // Act
    pressKey(container, 'person', 'Escape', '');

    // Assert
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it('cancels when Cancel is clicked', () => {
    // Arrange
    const { container, onCancel } = renderForm();

    // Act
    clickButton(container, 'predefined-question-cancel');

    // Assert
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it('does not ask when Cancel is clicked', () => {
    // Arrange
    const { container, onAsk } = renderForm();
    typeInto(container, 'person', 'jane.doe@gov.ab.ca');
    typeInto(container, 'service', 'form-service');

    // Act
    clickButton(container, 'predefined-question-cancel');

    // Assert
    expect(onAsk).not.toHaveBeenCalled();
  });

  it('ignores other keys', () => {
    // Arrange
    const { container, onAsk, onCancel } = renderForm();

    // Act
    pressKey(container, 'person', 'a', 'a');

    // Assert
    expect([onAsk.mock.calls.length, onCancel.mock.calls.length]).toEqual([0, 0]);
  });
});
