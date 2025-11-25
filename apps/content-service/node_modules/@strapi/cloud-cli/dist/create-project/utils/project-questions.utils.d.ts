import { DistinctQuestion } from 'inquirer';
import type { ProjectAnswers } from '../../types';
/**
 * Apply default values to questions based on the provided mapper
 * @param questionsMap - A partial object with keys matching the ProjectAnswers keys and values being the default value or a function to get the default value
 */
export declare function questionDefaultValuesMapper(questionsMap: Partial<{
    [K in keyof ProjectAnswers]: ((question: DistinctQuestion<ProjectAnswers>) => ProjectAnswers[K]) | ProjectAnswers[K];
}>): (questions: ReadonlyArray<DistinctQuestion<ProjectAnswers>>) => ReadonlyArray<DistinctQuestion<ProjectAnswers>>;
/**
 * Get default values from questions
 * @param questions - An array of questions for project creation
 */
export declare function getDefaultsFromQuestions(questions: ReadonlyArray<DistinctQuestion<ProjectAnswers>>): Partial<ProjectAnswers>;
/**
 * Get the default node version based on the current node version if it is in the list of choices
 * @param question - The question for the node version in project creation
 */
export declare function getProjectNodeVersionDefault(question: DistinctQuestion<ProjectAnswers>): string;
//# sourceMappingURL=project-questions.utils.d.ts.map