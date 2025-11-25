declare const questions: {
    type: string;
    name: string;
    message: string;
    default: string;
    choices: {
        name: string;
        value: string;
    }[];
    validate: (input: string) => true | "You must provide an input" | "Please use only letters, '-' and no spaces";
}[];
export default questions;
//# sourceMappingURL=kind-prompts.d.ts.map