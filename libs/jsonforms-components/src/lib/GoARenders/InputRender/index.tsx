import GoAInputControl from './InputControl';
import GoAInputTester from './InputTester';
export * from './InputControl';
export const GoAInputRenderers = [{ tester: GoAInputTester, renderer: GoAInputControl }];
