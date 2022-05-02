import { ValidationAction } from './checkInput';

/*
 * Use when checking input and pushing error messages
 * onto a React state
 */
export class ReactInputHandler implements ValidationAction {
  messages: Record<string, string>;
  setMessages: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  field: string;

  constructor(
    existingErrors: Record<string, string>,
    setErrors: React.Dispatch<React.SetStateAction<Record<string, string>>>,
    field: string
  ) {
    this.messages = existingErrors;
    this.setMessages = setErrors;
    this.field = field;
  }

  onFailure(message: string): void {
    const err = { ...this.messages };
    err[this.field] = message;
    this.setMessages(err);
  }

  onSuccess(): void {
    delete this.messages[this.field];
    this.setMessages({ ...this.messages });
  }
}
