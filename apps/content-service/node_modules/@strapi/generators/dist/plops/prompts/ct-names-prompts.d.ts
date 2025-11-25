interface Answers {
    displayName: string;
    singularName: string;
    pluralName: string;
}
declare const questions: ({
    type: string;
    name: string;
    message: string;
    validate: (input: string) => boolean;
    default?: undefined;
} | {
    type: string;
    name: string;
    message: string;
    default: (answers: Answers) => any;
    validate(input: string, answers: Answers): true | "Singular and plural names cannot be the same" | "Value must be in kebab-case";
})[];
export default questions;
//# sourceMappingURL=ct-names-prompts.d.ts.map