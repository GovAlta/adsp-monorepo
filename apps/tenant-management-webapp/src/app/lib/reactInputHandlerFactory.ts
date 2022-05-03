import { ValidationAction } from './checkInput';

/*
 * Use when checking input and pushing error messages
 * onto a React state
 */
export type ValidatorFactory = (field: string) => ValidationAction;

export const reactInputHandlerFactory = (
  messages: Record<string, string>,
  setMessages: React.Dispatch<React.SetStateAction<Record<string, string>>>
): ValidatorFactory => {
  return (field: string) => {
    return {
      onFailure(message: string): void {
        const err = { ...messages };
        err[field] = message;
        setMessages(err);
      },
      onSuccess(): void {
        delete messages[field];
        setMessages({ ...messages });
      },
    };
  };
};
