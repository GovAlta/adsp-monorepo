type EnvironmentErrorMessage = {
    projectName: string;
    firstLine: string;
    secondLine: string;
};
export declare const environmentErrorMessageFactory: ({ projectName, firstLine, secondLine, }: EnvironmentErrorMessage) => string;
export declare const environmentCreationErrorFactory: (environmentErrorMessage: string) => string;
export {};
//# sourceMappingURL=error-message-factories.d.ts.map