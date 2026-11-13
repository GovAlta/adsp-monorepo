import {
  fillQuestionTemplate,
  findMissingInputs,
  isTemplatedQuestion,
  PlainQuestion,
  QuestionInput,
  TemplatedQuestion,
} from './predefinedQuestion';

const PERSON_INPUT: QuestionInput = { name: 'person', label: 'Username or email', placeholder: 'jane.doe@gov.ab.ca' };
const SERVICE_INPUT: QuestionInput = { name: 'service', label: 'App or ADSP service', placeholder: 'form-service' };

describe('isTemplatedQuestion', () => {
  it('recognizes a question that asks for names before it is sent', () => {
    // Arrange
    const question: TemplatedQuestion = {
      label: 'Is Someone an Admin?',
      question: 'I want to check whether someone in my tenant is a tenant admin.',
      inputs: [PERSON_INPUT],
      template: 'Is {person} a tenant admin?',
    };

    // Act
    const templated = isTemplatedQuestion(question);

    // Assert
    expect(templated).toBe(true);
  });

  it('does not treat a question the guide answers as templated', () => {
    // Arrange
    const question: PlainQuestion = {
      label: 'Token Expiry',
      question: 'Why is my token expiring too quickly? How do I adjust token lifetimes?',
      guideTopic: 'token-expiry',
    };

    // Act
    const templated = isTemplatedQuestion(question);

    // Assert
    expect(templated).toBe(false);
  });
});

describe('fillQuestionTemplate', () => {
  it('fills each placeholder with the value typed in for it', () => {
    // Arrange
    const template = '{person} gets access denied in {service}. What are they missing?';

    // Act
    const question = fillQuestionTemplate(template, { person: 'jane.doe@gov.ab.ca', service: 'form-service' });

    // Assert
    expect(question).toBe('jane.doe@gov.ab.ca gets access denied in form-service. What are they missing?');
  });

  it('trims the values before filling them in', () => {
    // Arrange
    const template = 'Is {person} a tenant admin?';

    // Act
    const question = fillQuestionTemplate(template, { person: '  jane.doe@gov.ab.ca \n' });

    // Assert
    expect(question).toBe('Is jane.doe@gov.ab.ca a tenant admin?');
  });

  it('fills every occurrence of the same placeholder', () => {
    // Arrange
    const template = 'Who in my realm has the {role} role, and what does {role} let them do?';

    // Act
    const question = fillQuestionTemplate(template, { role: 'form-admin' });

    // Assert
    expect(question).toBe('Who in my realm has the form-admin role, and what does form-admin let them do?');
  });

  it('leaves a placeholder that has no value as it is', () => {
    // Arrange
    const template = 'Why can {first} do something {second} cannot? Compare their access.';

    // Act
    const question = fillQuestionTemplate(template, { first: 'jane.doe@gov.ab.ca' });

    // Assert
    expect(question).toBe('Why can jane.doe@gov.ab.ca do something {second} cannot? Compare their access.');
  });

  it('does not fill a placeholder that a typed value contains', () => {
    // Arrange
    const template = '{person} gets access denied in {service}. What are they missing?';

    // Act
    const question = fillQuestionTemplate(template, { person: '{service}', service: 'form-service' });

    // Assert
    expect(question).toBe('{service} gets access denied in form-service. What are they missing?');
  });

  it('inserts a value literally even when it looks like a replacement pattern', () => {
    // Arrange
    const template = 'Who in my realm has the {role} role?';

    // Act
    const question = fillQuestionTemplate(template, { role: "form-admin$&$'" });

    // Assert
    expect(question).toBe("Who in my realm has the form-admin$&$' role?");
  });
});

describe('findMissingInputs', () => {
  it('finds nothing missing when every input has a value', () => {
    // Arrange
    const values = { person: 'jane.doe@gov.ab.ca', service: 'form-service' };

    // Act
    const missing = findMissingInputs([PERSON_INPUT, SERVICE_INPUT], values);

    // Assert
    expect(missing).toEqual({});
  });

  it('says an input left empty is required, using its label', () => {
    // Arrange
    const values = { person: '', service: 'form-service' };

    // Act
    const missing = findMissingInputs([PERSON_INPUT, SERVICE_INPUT], values);

    // Assert
    expect(missing).toEqual({ person: 'Username or email is required.' });
  });

  it('treats an input that was never typed in as missing', () => {
    // Arrange
    const values = { person: 'jane.doe@gov.ab.ca' };

    // Act
    const missing = findMissingInputs([PERSON_INPUT, SERVICE_INPUT], values);

    // Assert
    expect(missing).toEqual({ service: 'App or ADSP service is required.' });
  });

  it('treats an input holding only spaces as missing', () => {
    // Arrange
    const values = { person: '   ' };

    // Act
    const missing = findMissingInputs([PERSON_INPUT], values);

    // Assert
    expect(missing).toEqual({ person: 'Username or email is required.' });
  });

  it('lists every missing input', () => {
    // Arrange
    const values = {};

    // Act
    const missing = findMissingInputs([PERSON_INPUT, SERVICE_INPUT], values);

    // Assert
    expect(missing).toEqual({
      person: 'Username or email is required.',
      service: 'App or ADSP service is required.',
    });
  });
});
