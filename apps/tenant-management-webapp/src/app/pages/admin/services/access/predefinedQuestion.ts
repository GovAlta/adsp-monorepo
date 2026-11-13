import type { AccessGuideTopic } from '../../../../store/agent/model';

/** A value the user types in before a predefined question is asked, such as a person's username. */
export interface QuestionInput {
  /** The {name} placeholder this value fills in the question's template. */
  name: string;
  label: string;
  placeholder: string;
}

interface QuestionBase {
  label: string;
  /** Shown as the button's tooltip, and sent as the question unless the question has a template. */
  question: string;
}

export interface PlainQuestion extends QuestionBase {
  /** The guide topic that answers the question without AI. */
  guideTopic?: AccessGuideTopic;
}

/** A question that names someone or something, so the user fills in the inputs before it is asked. */
export interface TemplatedQuestion extends QuestionBase {
  inputs: QuestionInput[];
  template: string;
}

export type PredefinedQuestion = PlainQuestion | TemplatedQuestion;

export interface QuestionTopic {
  label: string;
  subtopics: Record<string, PredefinedQuestion>;
}

export function isTemplatedQuestion(question: PredefinedQuestion): question is TemplatedQuestion {
  return 'template' in question;
}

/** Fills each {name} placeholder of a question template with the trimmed value typed in for it. */
export function fillQuestionTemplate(template: string, values: Record<string, string>): string {
  return template.replace(/\{(\w+)\}/g, (placeholder, name: string) => values[name]?.trim() ?? placeholder);
}

/** An error message for each input left empty, by input name. */
export function findMissingInputs(inputs: QuestionInput[], values: Record<string, string>): Record<string, string> {
  return Object.fromEntries(
    inputs.filter(({ name }) => !values[name]?.trim()).map(({ name, label }) => [name, `${label} is required.`]),
  );
}
